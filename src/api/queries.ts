// GraphQL Queries for LeetCode API

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
