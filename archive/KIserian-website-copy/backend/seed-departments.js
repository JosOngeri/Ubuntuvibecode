const { pool } = require('./config/database');

const seedDepartments = async () => {
  try {
    console.log('Starting to seed departments...');

    // Sample departments for SDA Church
    const departments = [
      {
        name: 'Sabbath School',
        description: 'Responsible for Sabbath School programs and Bible study classes for all age groups',
        head_id: null, // Will be set after creating users
        is_active: true
      },
      {
        name: 'Youth Ministry',
        description: 'Organizes activities and programs for the youth and young adults of the church',
        head_id: null,
        is_active: true
      },
      {
        name: 'Music Ministry',
        description: 'Leads worship through music, choir, and musical instruments during services',
        head_id: null,
        is_active: true
      },
      {
        name: 'Women\'s Ministry',
        description: 'Focuses on spiritual growth and fellowship among women in the church',
        head_id: null,
        is_active: true
      },
      {
        name: 'Men\'s Ministry',
        description: 'Provides spiritual development and fellowship opportunities for men',
        head_id: null,
        is_active: true
      },
      {
        name: 'Children\'s Ministry',
        description: 'Caters to the spiritual needs of children through age-appropriate activities',
        head_id: null,
        is_active: true
      },
      {
        name: 'Outreach & Evangelism',
        description: 'Coordinates evangelistic efforts and community outreach programs',
        head_id: null,
        is_active: true
      },
      {
        name: 'Health & Temperance',
        description: 'Promotes healthful living and temperance principles within the church community',
        head_id: null,
        is_active: true
      },
      {
        name: 'Stewardship',
        description: 'Manages church finances, budget, and promotes faithful stewardship principles',
        head_id: null,
        is_active: true
      },
      {
        name: 'Communication',
        description: 'Handles all church communications, social media, announcements, and publicity',
        head_id: null,
        is_active: true
      },
      {
        name: 'Prayer Ministry',
        description: 'Organizes prayer meetings, prayer chains, and intercessory prayer activities',
        head_id: null,
        is_active: true
      },
      {
        name: 'Family Life',
        description: 'Strengthens families through counseling, seminars, and family-oriented activities',
        head_id: null,
        is_active: true
      }
    ];

    // Clear existing departments
    await pool.query('DELETE FROM department_members');
    await pool.query('DELETE FROM departments');
    console.log('Cleared existing departments');

    // Insert departments
    for (const dept of departments) {
      const result = await pool.query(
        'INSERT INTO departments (name, description, head_id, is_active, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [dept.name, dept.description, dept.head_id, dept.is_active]
      );
      console.log(`Created department: ${result.rows[0].name}`);
    }

    console.log('Successfully seeded departments!');
    
    // Display summary
    const countResult = await pool.query('SELECT COUNT(*) as count FROM departments');
    console.log(`Total departments created: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('Error seeding departments:', error);
  } finally {
    process.exit(0);
  }
};

seedDepartments();
