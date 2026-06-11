/**
 * Swagger Configuration
 * OpenAPI/Swagger documentation setup
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ubuntu HRMS API',
      version: '1.0.0',
      description: 'Human Resource Management System API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@ubuntuhrms.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.ubuntuhrms.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'manager', 'employee'] },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            department: { type: 'string' },
            location: { type: 'string' },
            employmentType: { type: 'string', enum: ['full-time', 'part-time', 'contract'] },
            status: { type: 'string', enum: ['open', 'closed'] },
            applicationDeadline: { type: 'string', format: 'date' },
            salaryRange: { type: 'string' },
          },
        },
        JobApplication: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            jobId: { type: 'integer' },
            applicantName: { type: 'string' },
            applicantEmail: { type: 'string', format: 'email' },
            status: {
              type: 'string',
              enum: ['pending', 'shortlisted', 'interview_scheduled', 'hired', 'rejected'],
            },
            interviewDate: { type: 'string', format: 'date-time' },
            offeredSalary: { type: 'number' },
          },
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'integer' },
            attendanceDate: { type: 'string', format: 'date' },
            shift: { type: 'string', enum: ['Morning', 'Afternoon', 'Night'] },
            status: { type: 'string', enum: ['Present', 'Absent', 'Leave', 'Holiday'] },
            checkIn: { type: 'string', format: 'date-time' },
            checkOut: { type: 'string', format: 'date-time' },
            totalHoursWorked: { type: 'number' },
          },
        },
        Payslip: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'integer' },
            period: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
            grossPay: { type: 'number' },
            deductions: { type: 'number' },
            netPay: { type: 'number' },
            hoursWorked: { type: 'number' },
            hourlyRate: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'approved', 'paid'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/features/**/*.js', './src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
