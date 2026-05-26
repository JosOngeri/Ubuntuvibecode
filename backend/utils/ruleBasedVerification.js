/**
 * Rule-based verification service for recruitment
 * Provides fallback verification when AI services are unavailable
 */

const validateEmailFormat = (email) => {
  if (!email) return { valid: false, reason: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return { valid: emailRegex.test(email), reason: emailRegex.test(email) ? null : 'Invalid email format' };
};

const validatePhoneFormat = (phone) => {
  if (!phone) return { valid: false, reason: 'Phone is required' };
  const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
  return { valid: phoneRegex.test(phone), reason: phoneRegex.test(phone) ? null : 'Invalid phone format' };
};

const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return { valid: false, reason: 'Both start and end dates are required' };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return { valid: false, reason: 'End date must be after start date' };
  return { valid: true, reason: null };
};

const detectOverlappingDates = (employmentHistory) => {
  if (!employmentHistory || employmentHistory.length < 2) return { overlapping: false, overlaps: [] };
  
  const overlaps = [];
  const sortedHistory = [...employmentHistory]
    .filter(e => e.startDate && e.endDate)
    .map(e => ({ ...e, start: new Date(e.startDate), end: new Date(e.endDate) }))
    .sort((a, b) => a.start - b.start);

  for (let i = 0; i < sortedHistory.length - 1; i++) {
    const current = sortedHistory[i];
    const next = sortedHistory[i + 1];
    
    if (current.end > next.start) {
      overlaps.push({
        employment1: { company: current.company, position: current.position },
        employment2: { company: next.company, position: next.position },
        overlapPeriod: `${next.start.toISOString().split('T')[0]} to ${current.end.toISOString().split('T')[0]}`
      });
    }
  }

  return { overlapping: overlaps.length > 0, overlaps };
};

const calculateEmploymentGaps = (employmentHistory) => {
  if (!employmentHistory || employmentHistory.length < 2) return { gaps: [], totalGapMonths: 0 };
  
  const gaps = [];
  const sortedHistory = [...employmentHistory]
    .filter(e => e.startDate && e.endDate)
    .map(e => ({ ...e, start: new Date(e.startDate), end: new Date(e.endDate) }))
    .sort((a, b) => a.start - b.start);

  let totalGapMonths = 0;

  for (let i = 0; i < sortedHistory.length - 1; i++) {
    const current = sortedHistory[i];
    const next = sortedHistory[i + 1];
    
    const gapMonths = (next.start - current.end) / (1000 * 60 * 60 * 24 * 30);
    
    if (gapMonths > 1) {
      gaps.push({
        gapMonths: Math.round(gapMonths),
        period: `${current.end.toISOString().split('T')[0]} to ${next.start.toISOString().split('T')[0]}`,
        previousEmployment: { company: current.company, position: current.position },
        nextEmployment: { company: next.company, position: next.position }
      });
      totalGapMonths += gapMonths;
    }
  }

  return { gaps, totalGapMonths: Math.round(totalGapMonths) };
};

const validateEducationYears = (educationData) => {
  const issues = [];
  
  if (!educationData) return { valid: true, issues };

  const furtherEducation = educationData.furtherEducation || [];
  
  furtherEducation.forEach(edu => {
    if (edu.startYear && edu.endYear) {
      const startYear = parseInt(edu.startYear);
      const endYear = parseInt(edu.endYear);
      
      if (endYear < startYear) {
        issues.push({
          institution: edu.institution,
          reason: 'End year is before start year'
        });
      }
      
      const currentYear = new Date().getFullYear();
      if (endYear > currentYear) {
        issues.push({
          institution: edu.institution,
          reason: 'End year is in the future'
        });
      }
      
      const duration = endYear - startYear;
      if (duration > 10 && edu.qualification !== 'PhD') {
        issues.push({
          institution: edu.institution,
          reason: 'Unusually long duration for this qualification'
        });
      }
    }
  });

  return { valid: issues.length === 0, issues };
};

const extractKeywords = (text, keywords) => {
  if (!text || !keywords) return { matched: [], score: 0 };
  
  const lowerText = text.toLowerCase();
  const matched = keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
  const score = keywords.length > 0 ? (matched.length / keywords.length) * 100 : 0;
  
  return { matched, score: Math.round(score) };
};

const verifyEducation = (educationData) => {
  const results = {
    score: 0,
    verified: false,
    reasoning: '',
    flags: []
  };

  if (!educationData) {
    results.reasoning = 'No education data provided';
    return results;
  }

  const furtherEducation = educationData.furtherEducation || [];
  const certifications = educationData.certifications || [];

  // Validate education years
  const yearValidation = validateEducationYears(educationData);
  if (!yearValidation.valid) {
    results.flags.push(...yearValidation.issues);
  }

  // Calculate score based on education level
  let educationScore = 0;
  const educationLevels = {
    'High School': 20,
    'Diploma': 40,
    'Bachelor\'s': 60,
    'Master\'s': 80,
    'PhD': 100
  };

  furtherEducation.forEach(edu => {
    const levelScore = educationLevels[edu.educationLevel] || 0;
    educationScore = Math.max(educationScore, levelScore);
  });

  // Bonus for certifications
  const certificationBonus = Math.min(certifications.length * 5, 20);
  educationScore += certificationBonus;

  results.score = Math.min(educationScore, 100);
  results.verified = results.score > 0;
  results.reasoning = `${furtherEducation.length} education entries found. ${certifications.length} certifications. Highest level: ${furtherEducation.length > 0 ? furtherEducation[0].educationLevel || 'Not specified' : 'None'}.`;

  if (results.flags.length > 0) {
    results.reasoning += ` Flags: ${results.flags.map(f => f.reason).join(', ')}.`;
  }

  return results;
};

const verifyExperience = (employmentHistory) => {
  const results = {
    score: 0,
    verified: false,
    reasoning: '',
    flags: []
  };

  if (!employmentHistory || employmentHistory.length === 0) {
    results.reasoning = 'No employment history provided';
    return results;
  }

  // Check for overlapping dates
  const overlapCheck = detectOverlappingDates(employmentHistory);
  if (overlapCheck.overlapping) {
    results.flags.push({
      type: 'overlap',
      severity: 'high',
      description: 'Overlapping employment dates detected',
      details: overlapCheck.overlaps
    });
  }

  // Calculate employment gaps
  const gapAnalysis = calculateEmploymentGaps(employmentHistory);
  if (gapAnalysis.gaps.length > 0) {
    gapAnalysis.gaps.forEach(gap => {
      if (gap.gapMonths > 6) {
        results.flags.push({
          type: 'gap',
          severity: 'medium',
          description: `Employment gap of ${gap.gapMonths} months`,
          details: gap
        });
      }
    });
  }

  // Calculate total years of experience
  const totalYears = employmentHistory.reduce((sum, work) => {
    if (work.startDate && work.endDate) {
      const start = new Date(work.startDate);
      const end = new Date(work.endDate);
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      return sum + years;
    }
    return sum;
  }, 0);

  // Score based on years of experience
  let experienceScore = Math.min(totalYears * 10, 80);
  
  // Deduct for flags
  const overlapDeduction = overlapCheck.overlapping ? 20 : 0;
  const gapDeduction = gapAnalysis.totalGapMonths > 12 ? 15 : gapAnalysis.totalGapMonths > 6 ? 10 : 0;
  experienceScore -= overlapDeduction + gapDeduction;

  results.score = Math.max(0, Math.round(experienceScore));
  results.verified = results.score > 0;
  results.reasoning = `${employmentHistory.length} employment entries. Total experience: ${totalYears.toFixed(1)} years. Employment status: ${employmentHistory[0]?.employmentStatus || 'Not specified'}.`;

  if (results.flags.length > 0) {
    results.reasoning += ` Flags: ${results.flags.length} issues detected.`;
  }

  return results;
};

const verifySkills = (skills, jobRequirements) => {
  const results = {
    score: 0,
    verified: false,
    reasoning: '',
    flags: []
  };

  if (!skills) {
    results.reasoning = 'No skills data provided';
    return results;
  }

  const computerSkills = skills.computerSkills || [];
  const languages = skills.languages || [];
  const otherSkills = skills.otherSkills || [];

  const allSkills = [
    ...computerSkills.map(s => s.name),
    ...languages.map(s => s.language),
    ...otherSkills
  ];

  // Match against job requirements if provided
  let matchScore = 0;
  if (jobRequirements && jobRequirements.length > 0) {
    const keywordMatch = extractKeywords(allSkills.join(' '), jobRequirements);
    matchScore = keywordMatch.score;
  } else {
    // Score based on number of skills
    matchScore = Math.min(allSkills.length * 5, 80);
  }

  // Bonus for skill levels
  const skillLevelBonus = computerSkills.reduce((bonus, skill) => {
    const levels = { 'Beginner': 5, 'Intermediate': 10, 'Advanced': 15, 'Expert': 20 };
    return bonus + (levels[skill.skillLevel] || 0);
  }, 0);

  results.score = Math.min(matchScore + skillLevelBonus, 100);
  results.verified = results.score > 0;
  results.reasoning = `${allSkills.length} skills listed. Computer skills: ${computerSkills.length}, Languages: ${languages.length}, Other: ${otherSkills.length}.`;

  if (jobRequirements) {
    results.reasoning += ` Match with job requirements: ${matchScore}%.`;
  }

  return results;
};

const detectInconsistencies = (applicationData) => {
  const flags = [];

  const { personalInfo, education, employmentHistory, skills } = applicationData;

  // Cross-check education and employment timeline
  if (education && employmentHistory) {
    const furtherEducation = education.furtherEducation || [];
    furtherEducation.forEach(edu => {
      if (edu.endYear && employmentHistory.length > 0) {
        const eduEndYear = parseInt(edu.endYear);
        const firstEmployment = employmentHistory
          .filter(e => e.startDate)
          .map(e => new Date(e.startDate).getFullYear())
          .sort()[0];

        if (firstEmployment && eduEndYear > firstEmployment) {
          flags.push({
            type: 'timeline',
            severity: 'medium',
            description: 'Education end year after first employment',
            details: { education: edu.institution, firstEmploymentYear: firstEmployment }
          });
        }
      }
    });
  }

  // Check for unrealistic claims
  if (employmentHistory && employmentHistory.length > 0) {
    employmentHistory.forEach(work => {
      if (work.startDate && work.endDate) {
        const start = new Date(work.startDate);
        const end = new Date(work.endDate);
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365);

        if (years > 40) {
          flags.push({
            type: 'unrealistic',
            severity: 'high',
            description: 'Unusually long employment duration',
            details: { company: work.company, years: years.toFixed(1) }
          });
        }
      }
    });
  }

  return flags;
};

const verifyCandidate = async (applicationData, jobRequirements = {}) => {
  const { personalInfo, education, employmentHistory, skills } = applicationData;

  const verificationResults = {
    education: verifyEducation(education),
    experience: verifyExperience(employmentHistory),
    skills: verifySkills(skills, jobRequirements.skills || []),
    personal: {
      email: validateEmailFormat(personalInfo?.email),
      phone: validatePhoneFormat(personalInfo?.phone)
    }
  };

  const allFlags = [
    ...verificationResults.education.flags,
    ...verificationResults.experience.flags,
    ...verificationResults.skills.flags
  ];

  const inconsistencies = detectInconsistencies(applicationData);
  allFlags.push(...inconsistencies);

  // Calculate overall score
  const scores = [
    verificationResults.education.score,
    verificationResults.experience.score,
    verificationResults.skills.score
  ].filter(s => s > 0);

  const overallScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  // Determine verification status
  let verificationStatus = 'verified';
  if (overallScore < 50) verificationStatus = 'failed';
  else if (allFlags.some(f => f.severity === 'high')) verificationStatus = 'flagged';
  else if (allFlags.length > 0) verificationStatus = 'flagged';

  // Generate recommendation
  let recommendation = 'Proceed with interview';
  if (overallScore < 50) recommendation = 'Reject - insufficient qualifications';
  else if (verificationStatus === 'flagged') recommendation = 'Review with manager';
  else if (overallScore >= 80) recommendation = 'High priority candidate';

  return {
    verification_status: verificationStatus,
    verification_score: overallScore,
    verification_results: verificationResults,
    verification_flags: allFlags,
    ai_ranking: overallScore,
    ai_ranking_breakdown: {
      education: verificationResults.education.score,
      experience: verificationResults.experience.score,
      skills: verificationResults.skills.score,
      overall: overallScore
    },
    recommendation,
    reasoning: `Overall score: ${overallScore}/100. Education: ${verificationResults.education.score}/100. Experience: ${verificationResults.experience.score}/100. Skills: ${verificationResults.skills.score}/100. ${allFlags.length > 0 ? `${allFlags.length} flags detected.` : 'No major issues detected.'}`
  };
};

module.exports = {
  verifyCandidate,
  verifyEducation,
  verifyExperience,
  verifySkills,
  detectInconsistencies,
  validateEmailFormat,
  validatePhoneFormat,
  validateDateRange,
  detectOverlappingDates,
  calculateEmploymentGaps,
  validateEducationYears,
  extractKeywords
};
