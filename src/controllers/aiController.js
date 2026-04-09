const axios = require('axios');
const {
  Project,
  OnboardingData,
  MarketingPlan,
  FinancialRecord,
  Task,
  UserSubscription
} = require('../models');

const callGemini = async prompt => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    },
    {
      timeout: 60000
    }
  );

  const candidates = response.data && response.data.candidates;

  if (!candidates || !candidates.length) {
    return '';
  }

  const parts = candidates[0].content && candidates[0].content.parts;

  if (!parts || !parts.length) {
    return '';
  }

  return parts.map(part => part.text || '').join('');
};

exports.runConsultant = async (req, res, next) => {
  try {
    const { budget, location, experience, time, goal } = req.body;

    if (!budget || !location || !experience || !time || !goal) {
      return res.status(400).json({
        success: false,
        message: 'budget, location, experience, time, and goal are required'
      });
    }

    const analysisPrompt = `أنت محلل أعمال محترف.

بناءً على هذه البيانات:
الميزانية: ${budget}
المكان: ${location}
الخبرة: ${experience}
الوقت المتاح: ${time}
الهدف: ${goal}

قم بتحليل الحالة واقترح أنواع مشاريع مناسبة بلغة عربية واضحة ومنظمة.`;

    const analysis = await callGemini(analysisPrompt);

    const planPrompt = `أنت خبير تخطيط مشاريع.

بناءً على هذا التحليل:
${analysis}

أنشئ خطة مشروع كاملة تشمل:
- فكرة المشروع
- التكاليف المتوقعة
- الأرباح المحتملة
- المخاطر
- خطة 3 شهور خطوة بخطوة

اكتب الإجابة باللغة العربية وبشكل منظم ليسهل قراءتها.`;

    const plan = await callGemini(planPrompt);

    const evaluationPrompt = `أنت مستشار استثماري.

قيّم هذه الخطة من حيث:
- الربحية
- المخاطرة
- سهولة التنفيذ

وأعطِ تقييم نهائي مع السبب:
${plan}

اكتب الإجابة باللغة العربية وبشكل منظم.`;

    const evaluation = await callGemini(evaluationPrompt);

    const marketingPrompt = `أنت خبير تسويق رقمي.

أنشئ خطة تسويق للمشروع تشمل:
- اسم براند مقترح
- الجمهور المستهدف
- أفكار إعلانات
- محتوى شهر كامل لتطبيقات مثل تك توك وإنستجرام

بناءً على هذه الخطة:
${plan}

اكتب الإجابة باللغة العربية وبشكل منظم ومقسم لعناوين فرعية واضحة.`;

    const marketing = await callGemini(marketingPrompt);

    res.status(200).json({
      success: true,
      data: {
        analysis,
        plan,
        evaluation,
        marketing
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.generateContentIdeas = async (req, res, next) => {
  try {
    const { projectId, platform, topic } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    if (project.ownerId !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const industry = project.industry || 'General Business';
    const projectName = project.name;
    const targetPlatform = platform || 'All Social Media';
    const contentTopic = topic || 'General Engagement';

    const prompt = `
      Output Language: Arabic
      Act as a creative social media manager for a ${industry} project named "${projectName}".
      Generate 5 creative, high-engagement content ideas.
      
      Target Platform: ${targetPlatform}
      Focus Topic: ${contentTopic}
      
      Return ONLY a JSON array with the following structure:
      [
        {
          "title": "Short catchy title (Arabic)",
          "subtitle": "Brief description of the value (Arabic)",
          "platform": "instagram|facebook|linkedin|twitter|tiktok",
          "format": "carousel|video|image|text",
          "impact": "high|medium|low",
          "impactLabel": "عالية|متوسطة|منخفضة"
        }
      ]
      
      Ensure the content is in Arabic and culturally relevant.
      Do not include any markdown formatting, just the raw JSON.
    `;
    
    let ideas = [];
    try {
        const aiResponse = await callGemini(prompt);
        // Ensure aiResponse is valid before processing
        if (!aiResponse) {
             throw new Error("Empty AI Response");
        }
        
        const jsonString = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        ideas = JSON.parse(jsonString);
    } catch (e) {
        console.error("AI Generation Error:", e.message);
        
        // Return 500 error instead of fallback if AI fails
        // This allows frontend to show "Try Again" or "Error" state instead of fake data
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to generate content ideas. Please try again.',
            error: e.message
        });
    }
    
    // Add IDs
    ideas = ideas.map((idea, index) => ({ ...idea, id: index + 1 }));

    res.status(200).json({
      success: true,
      data: ideas
    });

  } catch (err) {
    next(err);
  }
};

exports.chatWithMentor = async (req, res, next) => {
  try {
    const { projectId, message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }

    let context = 'أنت "مساعد خطوة"، مستشار أعمال ذكي ومحترف يساعد رواد الأعمال في إدارة مشاريعهم.';

    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (project && project.ownerId === req.user.id) {
        // Fetch project context
        const [onboarding, tasks, financialRecords] = await Promise.all([
          OnboardingData.findOne({ where: { projectId } }),
          Task.findAll({ where: { projectId } }),
          FinancialRecord.findAll({ where: { projectId } })
        ]);

        const totalRevenue = financialRecords
          .filter(r => r.type === 'revenue')
          .reduce((sum, r) => sum + Number(r.amount || 0), 0);
        
        const tasksStats = {
          total: tasks.length,
          done: tasks.filter(t => t.status === 'done').length,
          todo: tasks.filter(t => t.status === 'todo').length
        };

        const challenges = onboarding?.currentChallenges 
          ? (Array.isArray(onboarding.currentChallenges) ? onboarding.currentChallenges.join(', ') : onboarding.currentChallenges)
          : 'لا يوجد';

        context += `
        بيانات المشروع الحالي:
        - الاسم: ${project.name}
        - المجال: ${project.industry || 'غير محدد'}
        - المرحلة: ${project.stage}
        - الإيرادات الكلية: ${totalRevenue} ريال
        - حالة المهام: ${tasksStats.done} منجز من أصل ${tasksStats.total}
        - التحديات المسجلة: ${challenges}
        `;
      }
    }

    // Build History Context
    let chatHistory = '';
    if (history && Array.isArray(history)) {
      // Take last 6 messages for context window
      const recentHistory = history.slice(-6); 
      chatHistory = recentHistory.map(msg => 
        `${msg.isUser ? 'المستخدم' : 'المساعد'}: ${msg.text}`
      ).join('\n');
    }

    const finalPrompt = `
    ${context}

    سياق المحادثة السابقة:
    ${chatHistory}

    المستخدم: ${message}
    
    المساعد (رد باللهجة المهنية والودودة، وبشكل مختصر ومفيد):
    `;

    const reply = await callGemini(finalPrompt);

    res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (err) {
    next(err);
  }
};

exports.analyzeOnboarding = async (req, res, next) => {
  try {
    const { projectId, stage, industry, teamSize, primaryGoal, challenges, goals } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }

    // 1. Verify Project Ownership
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // 2. Update Project Details (Stage & Industry)
    if (stage || industry) {
      if (stage) project.stage = stage;
      if (industry) project.industry = industry;
      await project.save();
    }

    // 3. Save/Update Onboarding Data
    let onboardingData = await OnboardingData.findOne({ where: { projectId } });
    if (!onboardingData) {
      onboardingData = await OnboardingData.create({
        projectId,
        teamSize: teamSize || null,
        longTermGoals: primaryGoal ? [primaryGoal] : [], // Map Primary Goal to Long Term
        shortTermGoals: goals || [], // Map Goals to Short Term
        currentChallenges: challenges || []
      });
    } else {
      if (teamSize) onboardingData.teamSize = teamSize;
      if (primaryGoal) onboardingData.longTermGoals = [primaryGoal];
      if (challenges) onboardingData.currentChallenges = challenges;
      if (goals) onboardingData.shortTermGoals = goals;
      await onboardingData.save();
    }

    // 4. Construct AI Prompt (Arabic)
    const prompt = `
    أنت مستشار أعمال استراتيجي للشركات الناشئة.
    قم بتحليل بيانات المشروع التالية وتقديم خطة عمل مخصصة باللغة العربية.

    بيانات المشروع:
    - المرحلة الحالية: ${project.stage === 'idea' ? 'فكرة (بداية من الصفر)' : 'مشروع قائم'}
    - المجال/الصناعة: ${project.industry || 'غير محدد'}
    - حجم الفريق: ${onboardingData.teamSize || 'غير محدد'}
    - التحديات الحالية: ${
      Array.isArray(onboardingData.currentChallenges) && onboardingData.currentChallenges.length
        ? onboardingData.currentChallenges.join(', ')
        : 'غير محدد'
    }
    - الهدف الأساسي (الدافع الرئيسي): ${Array.isArray(onboardingData.longTermGoals) ? onboardingData.longTermGoals.join(', ') : onboardingData.longTermGoals}
    - الأهداف للفترة القادمة: ${Array.isArray(onboardingData.shortTermGoals) ? onboardingData.shortTermGoals.join(', ') : onboardingData.shortTermGoals}

    المطلوب (يجب أن يكون الرد بصيغة JSON فقط):
    {
      "roadmap": [
        { "step": "عنوان الخطوة", "description": "شرح تفصيلي للخطوة" }
      ],
      "solutions": [
        { "challenge": "اسم التحدي المتوقع", "advice": "النصيحة/الحل المقترح" }
      ],
      "strategy": "نصيحة استراتيجية عامة لتحقيق الأهداف في هذا المجال"
    }
    
    ملاحظة: بما أن المستخدم قد لا يكون حدد تحديات صريحة، استنتج التحديات المتوقعة بناءً على المرحلة، الصناعة، وحجم الفريق، وقدم حلولاً لها.
    تأكد من أن الرد عبارة عن JSON صالح فقط بدون أي نصوص إضافية.
    `;

    // 5. Call Gemini
    const aiResponseText = await callGemini(prompt);
    
    // Clean up JSON response if it contains markdown code blocks
    const jsonString = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let aiResult;
    try {
      aiResult = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse AI JSON response:', jsonString);
      // Fallback if JSON parsing fails - wrap text in structure
      aiResult = {
        strategy: aiResponseText,
        roadmap: [],
        solutions: []
      };
    }

    // 6. Save AI Result
    onboardingData.aiAnalysisResult = aiResult;
    await onboardingData.save();

    // 7. Auto-generate Tasks from Roadmap
    if (aiResult.roadmap && Array.isArray(aiResult.roadmap) && aiResult.roadmap.length > 0) {
      const Task = require('../models/Task');
      
      const newTasks = aiResult.roadmap.map(step => ({
        projectId,
        title: step.step || 'New Task',
        description: step.description || '',
        status: 'todo',
        priority: 'high', // Default priority for roadmap items
        tags: ['AI Roadmap']
      }));

      try {
        await Task.bulkCreate(newTasks);
        console.log(`Created ${newTasks.length} tasks from AI roadmap for project ${projectId}`);
      } catch (taskError) {
        console.error('Error creating tasks from roadmap:', taskError);
        // Don't fail the whole request if task creation fails
      }
    }

    res.status(200).json({
      success: true,
      data: aiResult
    });

  } catch (error) {
    next(error);
  }
};

exports.runMentor = async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required'
      });
    }

    const subscription = await UserSubscription.findOne({
      where: { userId: req.user.id, status: 'active' }
    });

    if (!subscription || subscription.planType === 'Free') {
      return res.status(403).json({
        success: false,
        message: 'AI mentor is available for Pro and Business plans only'
      });
    }

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${projectId}`
      });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this project`
      });
    }

    const [onboarding, marketingPlans, financialRecords, tasks] = await Promise.all([
      OnboardingData.findOne({ where: { projectId: project.id } }),
      MarketingPlan.findAll({ where: { projectId: project.id, isActive: true } }),
      FinancialRecord.findAll({ where: { projectId: project.id } }),
      Task.findAll({ where: { projectId: project.id } })
    ]);

    const totalRevenue = financialRecords
      .filter(record => record.type === 'revenue')
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);

    const totalExpense = financialRecords
      .filter(record => record.type === 'expense')
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);

    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        const status = task.status || 'todo';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { todo: 0, in_progress: 0, done: 0 }
    );

    const currentChallenges = Array.isArray(onboarding && onboarding.currentChallenges)
      ? onboarding.currentChallenges
      : onboarding && onboarding.currentChallenges
        ? [onboarding.currentChallenges]
        : [];

    const shortTermGoals = Array.isArray(onboarding && onboarding.shortTermGoals)
      ? onboarding.shortTermGoals
      : onboarding && onboarding.shortTermGoals
        ? [onboarding.shortTermGoals]
        : [];

    const longTermGoals = Array.isArray(onboarding && onboarding.longTermGoals)
      ? onboarding.longTermGoals
      : onboarding && onboarding.longTermGoals
        ? [onboarding.longTermGoals]
        : [];

    const projectSnapshot = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description || '',
        industry: project.industry || '',
        stage: project.stage
      },
      onboarding: onboarding
        ? {
            teamSize: onboarding.teamSize || '',
            businessModel: onboarding.businessModel || '',
            currentChallenges,
            shortTermGoals,
            longTermGoals
          }
        : null,
      marketing: {
        activePlansCount: marketingPlans.length
      },
      finance: {
        totalRevenue,
        totalExpense,
        netIncome: totalRevenue - totalExpense
      },
      tasks: tasksByStatus
    };

    const contextLines = [];

    contextLines.push('أنت مرشد أعمال (AI Mentor) على منصة خطوة.');
    contextLines.push('المطلوب هو تقديم تحليل وخطة مخصصة لمشروع حقيقي بناءً على بياناته التالية:');
    contextLines.push('');
    contextLines.push(`- اسم المشروع: ${projectSnapshot.project.name}`);
    contextLines.push(`- الوصف: ${projectSnapshot.project.description || 'لا يوجد وصف مفصل'}`);
    contextLines.push(`- المرحلة: ${projectSnapshot.project.stage}`);
    contextLines.push(`- الصناعة: ${projectSnapshot.project.industry || 'غير محددة'}`);

    if (projectSnapshot.onboarding) {
      contextLines.push(`- حجم الفريق: ${projectSnapshot.onboarding.teamSize || 'غير محدد'}`);
      contextLines.push(`- نموذج العمل: ${projectSnapshot.onboarding.businessModel || 'غير محدد'}`);
      contextLines.push(
        `- التحديات الحالية: ${
          projectSnapshot.onboarding.currentChallenges.length
            ? projectSnapshot.onboarding.currentChallenges.join('، ')
            : 'لم يتم تحديد تحديات بشكل صريح'
        }`
      );
      contextLines.push(
        `- الأهداف قصيرة المدى: ${
          projectSnapshot.onboarding.shortTermGoals.length
            ? projectSnapshot.onboarding.shortTermGoals.join('، ')
            : 'غير محددة'
        }`
      );
      contextLines.push(
        `- الأهداف طويلة المدى: ${
          projectSnapshot.onboarding.longTermGoals.length
            ? projectSnapshot.onboarding.longTermGoals.join('، ')
            : 'غير محددة'
        }`
      );
    }

    contextLines.push(
      `- ملخص الأداء المالي: إجمالي الإيرادات = ${totalRevenue} ، إجمالي المصروفات = ${totalExpense} ، صافي الدخل = ${
        projectSnapshot.finance.netIncome
      }`
    );
    contextLines.push(
      `- ملخص المهام: (${projectSnapshot.tasks.todo} قيد التخطيط / ${projectSnapshot.tasks.in_progress} قيد التنفيذ / ${projectSnapshot.tasks.done} منجزة)`
    );
    contextLines.push(`- عدد الخطط التسويقية النشطة المسجلة: ${projectSnapshot.marketing.activePlansCount}`);

    const baseContext = contextLines.join('\n');

    const analysisPrompt = `${baseContext}

مهمتك في هذه المرحلة:
- تحليل وضع المشروع الحالي بناءً على هذه البيانات.
- تحديد أهم نقاط القوة والضعف والفرص والمخاطر (تحليل SWOT مبسط).
- اقتراح 3-5 اتجاهات عامة مناسبة للمشروع في هذه المرحلة.

اكتب التحليل باللغة العربية وبأسلوب واضح ومنظم في عناوين ونقاط.`;

    const analysis = await callGemini(analysisPrompt);

    const planPrompt = `أنت الآن نفس المرشد (AI Mentor).

بناءً على تحليل المشروع التالي:
${analysis}

أنشئ خطة عملية لمدة 3 شهور لهذا المشروع تشمل:
- أهداف واضحة لكل شهر.
- مجموعة من الأنشطة التسويقية المقترحة.
- تحسينات تشغيلية داخلية (مهام داخلية للفريق).
- ملاحظات مالية عامة (بدون أرقام دقيقة لكن مع اتجاهات واضحة).

اكتب الخطة باللغة العربية وبشكل منظم، وقسمها إلى شهور (شهر 1، شهر 2، شهر 3).`;

    const plan = await callGemini(planPrompt);

    const evaluationPrompt = `أنت مستشار استثماري يراجع هذه الخطة:
${plan}

قيّم الخطة من حيث:
- مدى واقعيتها مقارنة ببيانات المشروع.
- مستوى المخاطرة.
- درجة التعقيد وسهولة التنفيذ للفريق الحالي.

وفي النهاية، قدّم توصية نهائية (مثلاً: "مناسب جدًا للبدء الآن" أو "يحتاج لتعديلات قبل التنفيذ") مع توضيح السبب.

اكتب الإجابة باللغة العربية وبأسلوب واضح ومباشر.`;

    const evaluation = await callGemini(evaluationPrompt);

    const marketingPrompt = `أنت خبير تسويق رقمي على منصة خطوة.

اعتمادًا على خطة الثلاثة شهور السابقة، أنشئ:
- اسم براند مقترح للمشروع (مع 2-3 بدائل إن أمكن).
- توصيف للجمهور المستهدف.
- 5 أفكار حملات تسويقية رئيسية (مع القناة الأساسية لكل حملة).
- جدول محتوى مقترح لمدة شهر لمنصات مثل تك توك وإنستجرام (مثال لعدد من الفيديوهات/المنشورات مع فكرة قصيرة لكل واحد).

اكتب الإجابة باللغة العربية، واستخدم عناوين واضحة وقوائم نقطية.`;

    const marketing = await callGemini(marketingPrompt);

    if (onboarding) {
      try {
        await onboarding.update({
          aiAnalysisResult: {
            projectSnapshot,
            analysis,
            plan,
            evaluation,
            marketing,
            generatedAt: new Date().toISOString()
          }
        });
      } catch (updateError) {
        // Do not block response if persisting AI result fails
      }
    }

    res.status(200).json({
      success: true,
      data: {
        projectSnapshot,
        analysis,
        plan,
        evaluation,
        marketing
      }
    });
  } catch (err) {
    next(err);
  }
};
