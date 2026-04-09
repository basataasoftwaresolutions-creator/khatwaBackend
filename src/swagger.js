const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Khatwa Backend API',
    version: '1.0.0',
    description: `Khatwa Platform REST API documentation.\n\nAPI Base URL: ${process.env.SWAGGER_BASE_URL || 'http://localhost:5000'}`
  },
  servers: [
    {
      url: process.env.SWAGGER_BASE_URL || 'http://localhost:5000',
      description: 'API Base URL'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@example.com' },
          role: { type: 'string', example: 'user' },
          avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          ownerId: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'My Startup' },
          description: { type: 'string', nullable: true, example: 'A SaaS for startups' },
          industry: { type: 'string', nullable: true, example: 'SaaS' },
          stage: { type: 'string', example: 'idea' },
          logoUrl: { type: 'string', nullable: true, example: 'https://example.com/logo.png' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      MarketingPlan: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          projectId: { type: 'integer' },
          objectives: { type: 'object' },
          targetAudience: { type: 'object' },
          channels: { type: 'object' },
          contentStrategy: { type: 'string' },
          timeline: { type: 'object' },
          budget: { type: 'number', format: 'float' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      FinancialRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          projectId: { type: 'integer' },
          type: { type: 'string', enum: ['revenue', 'expense'] },
          amount: { type: 'number', format: 'float', example: 1000.5 },
          category: { type: 'string', example: 'Marketing' },
          date: { type: 'string', format: 'date-time' },
          title: { type: 'string', example: 'Ad Campaign' },
          description: { type: 'string' },
          currency: { type: 'string', example: 'SAR' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          projectId: { type: 'integer' },
          title: { type: 'string', example: 'Design landing page' },
          description: { type: 'string', nullable: true },
          assignedTo: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          tags: { 
            type: 'array', 
            items: { type: 'string' }, 
            example: ['Marketing', 'Design'] 
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      TeamMember: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          projectId: { type: 'integer' },
          userId: { type: 'integer' },
          role: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'] },
          jobTitle: { type: 'string', example: 'Backend Developer' },
          status: { type: 'string', enum: ['invited', 'active'] },
          joinedAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      CommunityPost: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          authorId: { type: 'integer' },
          title: { type: 'string' },
          content: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          likesCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CommunityComment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          postId: { type: 'integer' },
          authorId: { type: 'integer' },
          content: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          planType: { type: 'string', enum: ['Free', 'Pro', 'Business'] },
          status: { type: 'string', enum: ['active', 'canceled', 'expired'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          paymentDetails: { type: 'object', nullable: true }
        }
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          projectId: { type: 'integer' },
          createdBy: { type: 'integer' },
          type: { type: 'string', enum: ['financial', 'marketing', 'tasks', 'team', 'overall', 'custom'] },
          format: { type: 'string', enum: ['pdf', 'excel'] },
          dateFrom: { type: 'string', format: 'date-time' },
          dateTo: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['generated', 'failed'] },
          viewsCount: { type: 'integer' },
          downloadsCount: { type: 'integer' },
          sharesCount: { type: 'integer' },
          data: { type: 'object', nullable: true },
          aiSummary: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' }
        }
      },
      PagedSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          count: { type: 'integer', example: 1 },
          data: { type: 'array', items: { type: 'object' } }
        }
      },
      AuthTokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' }
        }
      }
    }
  },
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account and returns a JWT token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'password123', minLength: 6 },
                  role: { type: 'string', enum: ['user', 'admin'], example: 'user' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokenResponse' } } }
          },
          400: {
            description: 'Validation error or email already exists',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        description: 'Authenticates a user and returns a JWT token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokenResponse' } } }
          },
          400: {
            description: 'Missing email or password',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current logged-in user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          401: {
            description: 'Unauthorized, missing or invalid token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/auth/forgotpassword': {
      post: {
        tags: ['Auth'],
        summary: 'Forgot Password',
        description: 'Initiate password reset process by sending an email with reset token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Email sent successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          404: {
            description: 'User not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/auth/resetpassword/{resettoken}': {
      put: {
        tags: ['Auth'],
        summary: 'Reset Password',
        description: 'Reset user password using the token received in email.',
        security: [],
        parameters: [
          { name: 'resettoken', in: 'path', required: true, schema: { type: 'string' }, description: 'Reset token' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  password: { type: 'string', example: 'newStrongPassword123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Password reset successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokenResponse' } } }
          },
          400: {
            description: 'Invalid or expired token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Get all projects for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Project' } }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'My Startup' },
                  description: { type: 'string', example: 'A SaaS platform' },
                  industry: { type: 'string', example: 'SaaS' },
                  stage: { type: 'string', enum: ['idea', 'operating'], example: 'idea' },
                  logoUrl: { type: 'string', example: 'https://example.com/logo.png' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Project created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          400: {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'Project details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          401: {
            description: 'Unauthorized or not owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      put: {
        tags: ['Projects'],
        summary: 'Update project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  industry: { type: 'string' },
                  stage: { type: 'string', enum: ['idea', 'operating'] },
                  logoUrl: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Project updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          401: {
            description: 'Unauthorized or not owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'Project deleted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          401: {
            description: 'Unauthorized or not owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{id}/dashboard': {
      get: {
        tags: ['Projects'],
        summary: 'Get project dashboard stats',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'Dashboard stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        widgets: {
                          type: 'object',
                          properties: {
                            growthRate: {
                              type: 'object',
                              properties: {
                                value: { type: 'integer', example: 32 },
                                change: { type: 'integer', example: 12 },
                                trend: { type: 'string', example: 'up' }
                              }
                            },
                            monthlyExpenses: {
                              type: 'object',
                              properties: {
                                value: { type: 'integer', example: 74300 },
                                change: { type: 'integer', example: 8 },
                                trend: { type: 'string', example: 'up' }
                              }
                            },
                            taskCompletion: {
                              type: 'object',
                              properties: {
                                value: { type: 'integer', example: 78 },
                                change: { type: 'integer', example: 5 },
                                trend: { type: 'string', example: 'up' }
                              }
                            },
                            totalRevenue: {
                              type: 'object',
                              properties: {
                                value: { type: 'integer', example: 128500 },
                                change: { type: 'integer', example: 15 },
                                trend: { type: 'string', example: 'up' }
                              }
                            }
                          }
                        },
                        charts: {
                          type: 'object',
                          properties: {
                            weeklyTasks: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  week: { type: 'string', example: 'Week 1' },
                                  weekAr: { type: 'string', example: 'الأسبوع 1' },
                                  planned: { type: 'integer', example: 12 },
                                  completed: { type: 'integer', example: 8 }
                                }
                              }
                            },
                            monthlyPerformance: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  month: { type: 'string', example: 'Oct' },
                                  monthAr: { type: 'string', example: 'أكتوبر' },
                                  revenue: { type: 'integer', example: 5000 },
                                  taskCompletion: { type: 'integer', example: 85 },
                                  customerSatisfaction: { type: 'integer', example: 92 }
                                }
                              }
                            },
                            growthTrends: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  quarter: { type: 'string', example: 'Q1' },
                                  revenue: { type: 'integer', example: 12000 },
                                  customers: { type: 'integer', example: 120 },
                                  marketShare: { type: 'integer', example: 15 }
                                }
                              }
                            },
                            revenueForecast: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  month: { type: 'string', example: 'Jan' },
                                  monthAr: { type: 'string', example: 'يناير' },
                                  actual: { type: 'integer', nullable: true, example: 5000 },
                                  forecast: { type: 'integer', nullable: true, example: 5500 }
                                }
                              }
                            }
                          }
                        },
                        projectProgress: {
                          type: 'object',
                          properties: {
                            progress: { type: 'integer', example: 66 },
                            milestones: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'integer', example: 1 },
                                  name: { type: 'string', example: 'Create Project' },
                                  nameAr: { type: 'string', example: 'إنشاء المشروع' },
                                  description: { type: 'string', example: 'Create your first project' },
                                  descriptionAr: { type: 'string', example: 'قم بإنشاء مشروعك الأول' },
                                  completed: { type: 'boolean', example: true }
                                }
                              }
                            }
                          }
                        },
                        keyIndicators: {
                          type: 'object',
                          properties: {
                            highestMonthlyRevenue: { type: 'integer', example: 32000 },
                            bestWeekAchievement: { type: 'integer', example: 92 },
                            avgMonthlyGrowth: { type: 'integer', example: 18 },
                            newCustomersCount: { type: 'integer', example: 32 },
                            churnRate: { type: 'number', format: 'float', example: 4.2 },
                            customerSatisfaction: { type: 'integer', example: 85 }
                          }
                        },
                        insights: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              title: { type: 'string', example: 'Strong Financial Performance' },
                              titleAr: { type: 'string', example: 'أداء مالي قوي' },
                              description: { type: 'string', example: 'Profit margin 61% is excellent!' },
                              descriptionAr: { type: 'string', example: 'هامش ربحك 61% ممتاز!' },
                              type: { type: 'string', example: 'success' },
                              confidence: { type: 'integer', example: 95 }
                            }
                          }
                        },
                        tasks: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer', example: 13 },
                            completed: { type: 'integer', example: 8 },
                            inProgress: { type: 'integer', example: 3 },
                            todo: { type: 'integer', example: 2 },
                            progress: { type: 'integer', example: 75 },
                            upcoming: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'integer' },
                                  title: { type: 'string' },
                                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                                  dueDate: { type: 'string', format: 'date-time' },
                                  status: { type: 'string', enum: ['todo', 'in_progress'] }
                                }
                              }
                            }
                          }
                        },
                        recentActivities: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              type: { type: 'string', enum: ['task', 'team', 'finance', 'marketing'] },
                              message: { type: 'string', example: 'Task "Design Logo" completed' },
                              messageAr: { type: 'string', example: 'تم إكمال مهمة "تصميم الشعار"' },
                              time: { type: 'string', format: 'date-time' }
                            }
                          }
                        },
                        activity: {
                          type: 'object',
                          properties: {
                            weekly: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  day: { type: 'string', example: 'Monday' },
                                  dayAr: { type: 'string', example: 'الاثنين' },
                                  count: { type: 'integer', example: 5 }
                                }
                              }
                            },
                            total: { type: 'integer', example: 8 },
                            dailyAverage: { type: 'number', example: 1.1 }
                          }
                        },
                        finance: {
                          type: 'object',
                          properties: {
                            revenue: { type: 'number', example: 45000 },
                            revenueChange: { type: 'integer', example: 12 },
                            expenses: { type: 'number', example: 17550 },
                            expensesChange: { type: 'integer', example: -5 },
                            profit: { type: 'number', example: 27450 },
                            profitMargin: { type: 'integer', example: 61 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Forbidden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/marketing-dashboard': {
      get: {
        tags: ['Marketing'],
        summary: 'Get marketing dashboard stats',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }],
        responses: {
          200: {
            description: 'Marketing dashboard stats',
            content: { 
              'application/json': { 
                schema: { 
                  type: 'object', 
                  properties: { 
                    success: { type: 'boolean' }, 
                    data: { 
                      type: 'object', 
                      properties: { 
                        activeCampaigns: { 
                          type: 'object',
                          properties: {
                            count: { type: 'integer', example: 3 },
                            remainingDays: { type: 'integer', example: 15 }
                          }
                        }, 
                        totalEngagement: { type: 'integer', example: 12500 },
                        scheduledContent: {
                          type: 'object',
                          properties: {
                            count: { type: 'integer', example: 8 },
                            period: { type: 'string', example: 'Next Week' }
                          }
                        },
                        publishedContent: {
                          type: 'object',
                          properties: {
                            count: { type: 'integer', example: 24 },
                            growth: { type: 'integer', example: 12 }
                          }
                        },
                        contentPerformance: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              month: { type: 'string', example: 'Jun' },
                              monthAr: { type: 'string', example: 'يونيو' },
                              year: { type: 'integer', example: 2025 },
                              posts: { type: 'integer', example: 10 },
                              engagement: { type: 'integer', example: 500 }
                            }
                          }
                        },
                        channelPerformance: {
                          type: 'object',
                          properties: {
                            facebook: { type: 'integer', example: 45 },
                            instagram: { type: 'integer', example: 80 },
                            twitter: { type: 'integer', example: 20 },
                            linkedin: { type: 'integer', example: 90 },
                            tiktok: { type: 'integer', example: 60 }
                          }
                        },
                        dailyEngagement: {
                          type: 'object',
                          properties: {
                            chartData: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  date: { type: 'string', example: '2025-06-01' },
                                  count: { type: 'integer', example: 450 }
                                }
                              }
                            },
                            dailyAverage: { type: 'integer', example: 474 },
                            highestDay: { type: 'integer', example: 683 }
                          }
                        },
                        planProgress: {
                          type: 'object',
                          properties: {
                            percentage: { type: 'integer', example: 40 },
                            milestones: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'integer', example: 1 },
                                  title: { type: 'string', example: 'Define Target Audience' },
                                  subtitle: { type: 'string', example: 'Identify ideal customer segments' },
                                  status: { type: 'string', example: 'completed' }
                                }
                              }
                            }
                          }
                        },
                        upcomingContent: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer', example: 10 },
                              title: { type: 'string', example: 'Daily Tip for Entrepreneurs' },
                              status: { type: 'string', example: 'scheduled' },
                              platform: { type: 'string', example: 'instagram' },
                              scheduledAt: { type: 'string', format: 'date-time' },
                              timeLabel: { type: 'string', example: '09:00 ص' }
                            }
                          }
                        },
                        smartIdeas: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer', example: 1 },
                              title: { type: 'string', example: 'نصيحة يومية لرواد الأعمال' },
                              subtitle: { type: 'string', example: 'محتوى ملهم يساعد على النجاح' },
                              platform: { type: 'string', example: 'instagram' },
                              format: { type: 'string', example: 'carousel' },
                              impact: { type: 'string', example: 'high' },
                              impactLabel: { type: 'string', example: 'عالية' }
                            }
                          }
                        }
                      } 
                    } 
                  } 
                } 
              }
            }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/marketing-plans': {
      post: {
        tags: ['Marketing'],
        summary: 'Create marketing plan for a project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  objectives: { type: 'object' },
                  targetAudience: { type: 'object' },
                  channels: { type: 'object' },
                  contentStrategy: { type: 'string' },
                  timeline: { type: 'object' },
                  budget: { type: 'number', format: 'float' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Marketing plan created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          400: {
            description: 'Active plan already exists or validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Forbidden, not project owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      get: {
        tags: ['Marketing'],
        summary: 'Get active marketing plan for a project',
        description: 'Get latest active plan by default. Pass ?all=true to list all plans.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' },
          { name: 'all', in: 'query', required: false, schema: { type: 'boolean' }, description: 'Set to true to list all plans (campaigns)' }
        ],
        responses: {
          200: {
            description: 'Active marketing plan',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project or plan not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/marketing-plans/{id}': {
      put: {
        tags: ['Marketing'],
        summary: 'Update marketing plan',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Marketing plan ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  objectives: { type: 'object' },
                  targetAudience: { type: 'object' },
                  channels: { type: 'object' },
                  contentStrategy: { type: 'string' },
                  timeline: { type: 'object' },
                  budget: { type: 'number', format: 'float' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Marketing plan updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not owner/admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Plan not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        tags: ['Marketing'],
        summary: 'Delete marketing plan',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Marketing plan ID' }
        ],
        responses: {
          200: {
            description: 'Marketing plan deleted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not owner/admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Plan not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/analytics/{projectId}/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics dashboard data',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'Analytics dashboard data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        tasks: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            completed: { type: 'integer' },
                            completionRate: { type: 'number' }
                          }
                        },
                        finance: {
                          type: 'object',
                          properties: {
                            revenue: { type: 'number' },
                            expense: { type: 'number' },
                            netProfit: { type: 'number' }
                          }
                        },
                        marketing: {
                          type: 'object',
                          properties: {
                            totalCampaigns: { type: 'integer' },
                            activeCampaigns: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/finance': {
      post: {
        tags: ['Finance'],
        summary: 'Add financial record',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'amount'],
                properties: {
                  type: { type: 'string', enum: ['revenue', 'expense'] },
                  amount: { type: 'number', format: 'float' },
                  category: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  currency: { type: 'string', example: 'SAR' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Financial record created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      get: {
        tags: ['Finance'],
        summary: 'Get financial records for project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, required: false },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, required: false }
        ],
        responses: {
          200: {
            description: 'List of financial records',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/FinancialRecord' } }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/finance/summary': {
      get: {
        tags: ['Finance'],
        summary: 'Get financial summary (profit/loss)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'Financial summary',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/finance/chart-data': {
      get: {
        tags: ['Finance'],
        summary: 'Get chart data for finance dashboard',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'Chart data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/finance/transactions': {
      get: {
        tags: ['Finance'],
        summary: 'Get recent financial transactions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'Recent transactions',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PagedSuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/finance/{recordId}': {
      put: {
        tags: ['Finance'],
        summary: 'Update financial record',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' },
          { name: 'recordId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Record ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['revenue', 'expense'] },
                  amount: { type: 'number', format: 'float' },
                  category: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  title: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Financial record updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Record not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        tags: ['Finance'],
        summary: 'Delete financial record',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' },
          { name: 'recordId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Record ID' }
        ],
        responses: {
          200: {
            description: 'Financial record deleted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Record not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/finance-dashboard': {
      get: {
        tags: ['Finance'],
        summary: 'Get finance dashboard stats',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'Dashboard stats',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/tasks': {
      post: {
        tags: ['Tasks'],
        summary: 'Create task for project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  assignedTo: { type: 'integer' },
                  status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  dueDate: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Task created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      get: {
        tags: ['Tasks'],
        summary: 'Get tasks for project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['todo', 'in_progress', 'done'] }
          }
        ],
        responses: {
          200: {
            description: 'List of tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Task' } }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/tasks/{id}': {
      put: {
        tags: ['Tasks'],
        summary: 'Update task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Task ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  assignedTo: { type: 'integer' },
                  status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  dueDate: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Task updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Task not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Task ID' }
        ],
        responses: {
          200: {
            description: 'Task deleted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not authorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Task not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/team': {
      post: {
        tags: ['Team'],
        summary: 'Add member to project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'member@example.com' },
                  role: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'], example: 'viewer' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Member added, returns full members list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/TeamMember' } }
                  }
                }
              }
            }
          },
          400: {
            description: 'User already member or invalid data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Forbidden, not owner/admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project or user not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      get: {
        tags: ['Team'],
        summary: 'Get project members',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        responses: {
          200: {
            description: 'List of team members',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/TeamMember' } }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden, not member/owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/team/invite': {
      post: {
        tags: ['Team'],
        summary: 'Invite member via email',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'invitee@example.com' },
                  role: { type: 'string', enum: ['owner', 'admin', 'editor', 'viewer'], example: 'viewer' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Member invited (added as invited)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          400: {
            description: 'User already member or invalid data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Forbidden, not owner/admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/projects/{projectId}/team/{userId}': {
      delete: {
        tags: ['Team'],
        summary: 'Remove member from project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' },
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' }, description: 'User ID' }
        ],
        responses: {
          200: {
            description: 'Member removed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not owner/admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project or member not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/community/stats': {
      get: {
        tags: ['Community'],
        summary: 'Get community dashboard stats',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Community stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        activeMembers: { type: 'integer', example: 5 },
                        totalPosts: { type: 'integer', example: 6 },
                        todaysPosts: { type: 'integer', example: 2 },
                        interactions: { type: 'integer', example: 378 }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/community/posts/{postId}/comments': {
      post: {
        tags: ['Community'],
        summary: 'Add comment to post',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Post ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Comment created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          404: { description: 'Post not found' },
          500: { description: 'Server error' }
        }
      },
      get: {
        tags: ['Community'],
        summary: 'Get comments for a post',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Post ID' }
        ],
        responses: {
          200: {
            description: 'List of comments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Comment' } }
                  }
                }
              }
            }
          },
          404: { description: 'Post not found' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/community/trending-topics': {
      get: {
        tags: ['Community'],
        summary: 'Get trending topics (tags)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of trending tags',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          tag: { type: 'string', example: 'marketing' },
                          count: { type: 'integer', example: 12 }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/community/top-contributors': {
      get: {
        tags: ['Community'],
        summary: 'Get top contributors',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of top contributors',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          authorId: { type: 'integer', example: 1 },
                          postCount: { type: 'integer', example: 15 },
                          author: {
                            type: 'object',
                            properties: {
                              name: { type: 'string', example: 'Jane Doe' },
                              avatarUrl: { type: 'string', example: 'http://...' },
                              jobTitle: { type: 'string', example: 'Marketing Manager' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/community/posts': {
      get: {
        tags: ['Community'],
        summary: 'Get all posts',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: 'Search by title or content' },
          { name: 'filter', in: 'query', required: false, schema: { type: 'string', enum: ['newest', 'popular', 'mine'] }, description: 'Filter posts' }
        ],
        responses: {
          200: {
            description: 'List of posts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/CommunityPost' },
                          {
                            type: 'object',
                            properties: {
                              commentsCount: { type: 'integer', example: 5 },
                              author: {
                                type: 'object',
                                properties: {
                                  name: { type: 'string', example: 'John Doe' },
                                  email: { type: 'string', example: 'john@example.com' },
                                  avatarUrl: { type: 'string', example: 'http://...' },
                                  jobTitle: { type: 'string', example: 'Software Engineer' }
                                }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      post: {
        tags: ['Community'],
        summary: 'Create a new community post',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  scheduledAt: { type: 'string', format: 'date-time', description: 'Schedule time for the post' },
                  status: { type: 'string', enum: ['draft', 'scheduled', 'published'], default: 'published' },
                  platform: { type: 'string', enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'other'], default: 'other' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Post created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          400: {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/community/posts/{id}': {
      get: {
        tags: ['Community'],
        summary: 'Get single post with comments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Post ID' }
        ],
        responses: {
          200: {
            description: 'Post details with comments',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          404: {
            description: 'Post not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      put: {
        tags: ['Community'],
        summary: 'Update post',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Post ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Post updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not author',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Post not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        tags: ['Community'],
        summary: 'Delete post',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Post ID' }
        ],
        responses: {
          200: {
            description: 'Post deleted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not author/admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Post not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/community/posts/{id}/like': {
      put: {
        tags: ['Community'],
        summary: 'Toggle like on post',
        description: 'If the current user has not liked the post, this will like it. Otherwise it will unlike.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Post ID' }
        ],
        responses: {
          200: {
            description: 'Post like state toggled, returns updated post',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          404: {
            description: 'Post not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/community/posts/{postId}/comments': {
      post: {
        tags: ['Community'],
        summary: 'Add comment to post',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Post ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Great post!' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Comment created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          404: {
            description: 'Post not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/community/comments/{id}': {
      delete: {
        tags: ['Community'],
        summary: 'Delete comment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Comment ID' }
        ],
        responses: {
          200: {
            description: 'Comment deleted',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          403: {
            description: 'Forbidden, not author/admin',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Comment not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/ai/consultant': {
      post: {
        tags: ['AI'],
        summary: 'Run AI business consultant',
        description: 'Uses AI to analyze user inputs (budget, location, experience, time, goal) and return analysis, plan, evaluation, and marketing suggestions.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['budget', 'location', 'experience', 'time', 'goal'],
                properties: {
                  budget: { type: 'string', example: '500000' },
                  location: { type: 'string', example: 'القاهرة' },
                  experience: { type: 'string', example: 'لا توجد خبرة سابقة' },
                  time: { type: 'string', example: '8 ساعات يوميًا' },
                  goal: { type: 'string', example: 'بناء براند ملابس ناجح' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'AI consultant result with analysis, plan, evaluation, and marketing ideas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        analysis: { type: 'string' },
                        plan: { type: 'string' },
                        evaluation: { type: 'string' },
                        marketing: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Missing or invalid input fields',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized, missing or invalid token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server or AI provider error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/ai/mentor': {
      post: {
        tags: ['AI'],
        summary: 'Run project-aware AI mentor',
        description: 'Uses real project data (project, onboarding, marketing, finance, tasks) to generate a full Arabic analysis, plan, evaluation, and marketing strategy.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId'],
                properties: {
                  projectId: { type: 'integer', example: 4 }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'AI mentor result with snapshot, analysis, plan, evaluation, and marketing content',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        projectSnapshot: {
                          type: 'object',
                          properties: {
                            project: { $ref: '#/components/schemas/Project' },
                            onboarding: { type: 'object', nullable: true },
                            marketing: {
                              type: 'object',
                              properties: {
                                activePlansCount: { type: 'integer', example: 1 }
                              }
                            },
                            finance: {
                              type: 'object',
                              properties: {
                                totalRevenue: { type: 'number', example: 10000 },
                                totalExpense: { type: 'number', example: 5000 },
                                netIncome: { type: 'number', example: 5000 }
                              }
                            },
                            tasks: {
                              type: 'object',
                              properties: {
                                todo: { type: 'integer', example: 3 },
                                in_progress: { type: 'integer', example: 2 },
                                done: { type: 'integer', example: 10 }
                              }
                            }
                          }
                        },
                        analysis: { type: 'string' },
                        plan: { type: 'string' },
                        evaluation: { type: 'string' },
                        marketing: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Missing projectId',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized, missing or invalid token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Forbidden, free plan or not project owner',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server or AI provider error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/ai/onboarding-analysis': {
      post: {
        tags: ['AI'],
        summary: 'Analyze onboarding data',
        description: 'Analyzes project onboarding data (stage, industry, challenges, goals) and returns a JSON roadmap in Arabic.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId'],
                properties: {
                  projectId: { type: 'integer', example: 1 },
                  stage: { type: 'string', example: 'idea', description: 'idea | operating' },
                  industry: { type: 'string', example: 'Fashion' },
                  teamSize: { type: 'string', example: 'Small Team (2-5)', description: 'Solo, Small, Medium, Large' },
                  primaryGoal: { type: 'string', example: 'Increase Sales', description: 'Main focus from Screen 2' },
                  challenges: { type: 'array', items: { type: 'string' }, example: ['ضعف التسويق', 'قلة المبيعات'], description: 'Challenges from Screen 5' },
                  goals: { type: 'array', items: { type: 'string' }, example: ['Build Brand', 'Increase Revenue'], description: 'Goals for coming period from Screen 5' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'AI analysis result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        roadmap: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              step: { type: 'string' },
                              description: { type: 'string' }
                            }
                          }
                        },
                        solutions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              challenge: { type: 'string' },
                              advice: { type: 'string' }
                            }
                          }
                        },
                        strategy: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Missing project ID',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/v1/ai/content-ideas': {
      post: {
        tags: ['AI'],
        summary: 'Generate creative content ideas',
        description: 'Generates 5 creative social media content ideas using AI (or returns smart suggestions).',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId'],
                properties: {
                  projectId: { type: 'integer', example: 1 },
                  platform: { type: 'string', example: 'instagram', description: 'Optional: instagram, facebook, etc.' },
                  topic: { type: 'string', example: 'Marketing Tips', description: 'Optional: focus topic' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'List of content ideas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          title: { type: 'string', example: 'نصيحة يومية' },
                          subtitle: { type: 'string', example: 'محتوى ملهم' },
                          platform: { type: 'string', example: 'instagram' },
                          format: { type: 'string', example: 'carousel' },
                          impact: { type: 'string', example: 'high' },
                          impactLabel: { type: 'string', example: 'عالية' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Missing project ID' },
          401: { description: 'Unauthorized' },
          404: { description: 'Project not found' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/projects/{projectId}/reports/overview': {
      get: {
        tags: ['Reports'],
        summary: 'Get reports overview for a project',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }],
        responses: {
          200: {
            description: 'Reports overview and templates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        overview: {
                          type: 'object',
                          properties: {
                            views: { type: 'integer', example: 312 },
                            shares: { type: 'integer', example: 34 },
                            downloads: { type: 'integer', example: 87 },
                            totalReports: { type: 'integer', example: 6 }
                          }
                        },
                        chartData: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              month: { type: 'string', example: 'يناير' },
                              count: { type: 'integer', example: 5 }
                            }
                          }
                        },
                        templates: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer', example: 1 },
                              type: { type: 'string', example: 'marketing' },
                              titleAr: { type: 'string', example: 'تقرير التسويق' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Project not found' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/projects/{projectId}/reports': {
      get: {
        tags: ['Reports'],
        summary: 'List reports for a project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', example: 20 } },
          { name: 'offset', in: 'query', required: false, schema: { type: 'integer', example: 0 } },
          { name: 'type', in: 'query', required: false, schema: { type: 'string', enum: ['financial', 'marketing', 'tasks', 'team', 'overall', 'custom'] } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Reports list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 2 },
                    data: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/Report' },
                          {
                            type: 'object',
                            properties: {
                              creator: {
                                type: 'object',
                                properties: {
                                  id: { type: 'integer', example: 1 },
                                  name: { type: 'string', example: 'John Doe' },
                                  avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' }
                                }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Project not found' },
          500: { description: 'Server error' }
        }
      },
      post: {
        tags: ['Reports'],
        summary: 'Create a report for a project',
        description: 'Generates report data and an Arabic AI summary (fallback if AI unavailable).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Project ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'format', 'dateFrom', 'dateTo'],
                properties: {
                  type: { type: 'string', enum: ['financial', 'marketing', 'tasks', 'team', 'overall', 'custom'], example: 'overall' },
                  format: { type: 'string', enum: ['pdf', 'excel'], example: 'pdf' },
                  dateFrom: { type: 'string', format: 'date', example: '2026-01-31' },
                  dateTo: { type: 'string', format: 'date', example: '2026-02-27' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Report created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        reportId: { type: 'integer', example: 10 },
                        projectId: { type: 'integer', example: 1 },
                        type: { type: 'string', example: 'overall' },
                        format: { type: 'string', example: 'pdf' },
                        dateFrom: { type: 'string', format: 'date-time' },
                        dateTo: { type: 'string', format: 'date-time' },
                        status: { type: 'string', example: 'generated' },
                        data: { type: 'object' },
                        aiSummary: { type: 'string', example: 'ملخص التقرير...' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid input' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Project not found' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/reports/{reportId}': {
      get: {
        tags: ['Reports'],
        summary: 'Get a report by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reportId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Report ID' }],
        responses: {
          200: {
            description: 'Report details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Report' }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Report not found' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/reports/{reportId}/track': {
      post: {
        tags: ['Reports'],
        summary: 'Track report event',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reportId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Report ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string', enum: ['view', 'download', 'share'], example: 'download' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Updated counters',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 10 },
                        viewsCount: { type: 'integer', example: 12 },
                        downloadsCount: { type: 'integer', example: 4 },
                        sharesCount: { type: 'integer', example: 1 }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid action' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Report not found' },
          500: { description: 'Server error' }
        }
      }
    },
    '/api/v1/subscriptions': {
      get: {
        tags: ['Subscriptions'],
        summary: 'Get current user subscription',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Subscription details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      put: {
        tags: ['Subscriptions'],
        summary: 'Update subscription plan',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planType'],
                properties: {
                  planType: { type: 'string', enum: ['Free', 'Pro', 'Business'], example: 'Pro' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Subscription updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          400: {
            description: 'Invalid plan type',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        tags: ['Subscriptions'],
        summary: 'Cancel subscription',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Subscription canceled',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
          },
          400: {
            description: 'Subscription already canceled',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'No active subscription found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          500: {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
