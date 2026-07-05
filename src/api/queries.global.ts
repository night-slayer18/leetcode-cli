// GraphQL queries for leetcode.com (global schema)

export const PROBLEM_LIST_QUERY = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        isPaidOnly
        acRate
        topicTags {
          name
          slug
        }
        status
      }
    }
  }
`;

export const PROBLEM_DETAIL_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      content
      difficulty
      isPaidOnly
      topicTags {
        name
        slug
      }
      codeSnippets {
        lang
        langSlug
        code
      }
      sampleTestCase
      exampleTestcases
      hints
      companyTags {
        name
        slug
      }
      stats
      status
    }
  }
`;

export const USER_STATUS_QUERY = `
  query globalData {
    userStatus {
      isSignedIn
      username
    }
  }
`;

export const USER_PROFILE_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        ranking
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      userCalendar {
        streak
        totalActiveDays
        submissionCalendar
      }
    }
  }
`;

export const SKILL_STATS_QUERY = `
  query skillStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
      }
    }
  }
`;

export const DAILY_CHALLENGE_QUERY = `
  query questionOfToday {
    activeDailyCodingChallengeQuestion {
      date
      link
      question {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        isPaidOnly
        acRate
        topicTags {
          name
          slug
        }
        status
      }
    }
  }
`;

export const SUBMISSION_LIST_QUERY = `
  query submissionList($questionSlug: String!, $limit: Int, $offset: Int) {
    questionSubmissionList(
      questionSlug: $questionSlug
      limit: $limit
      offset: $offset
    ) {
      submissions {
        id
        statusDisplay
        lang
        runtime
        timestamp
        memory
      }
    }
  }
`;

export const RANDOM_PROBLEM_QUERY = `
  query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
    randomQuestion(categorySlug: $categorySlug, filters: $filters) {
      titleSlug
    }
  }
`;

export const SUBMISSION_DETAILS_QUERY = `
  query submissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
      code
      runtime
      runtimeDisplay
      runtimePercentile
      memory
      memoryDisplay
      memoryPercentile
      statusDisplay
      lang {
        name
      }
    }
  }
`;

export interface QueryPack {
  PROBLEM_LIST_QUERY: string;
  PROBLEM_DETAIL_QUERY: string;
  USER_STATUS_QUERY: string;
  USER_PROFILE_QUERY: string;
  SKILL_STATS_QUERY: string;
  DAILY_CHALLENGE_QUERY: string;
  SUBMISSION_LIST_QUERY: string;
  RANDOM_PROBLEM_QUERY: string;
  SUBMISSION_DETAILS_QUERY: string;
}

export const GLOBAL_QUERY_PACK: QueryPack = {
  PROBLEM_LIST_QUERY,
  PROBLEM_DETAIL_QUERY,
  USER_STATUS_QUERY,
  USER_PROFILE_QUERY,
  SKILL_STATS_QUERY,
  DAILY_CHALLENGE_QUERY,
  SUBMISSION_LIST_QUERY,
  RANDOM_PROBLEM_QUERY,
  SUBMISSION_DETAILS_QUERY,
};
