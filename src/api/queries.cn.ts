// GraphQL queries for leetcode.cn (China schema)
import {
  DAILY_CHALLENGE_QUERY as DAILY_CHALLENGE_QUERY_GLOBAL,
  CONTEST_DETAIL_QUERY as CONTEST_DETAIL_QUERY_GLOBAL,
  RANDOM_PROBLEM_QUERY,
  SUBMISSION_DETAILS_QUERY,
  SUBMISSION_LIST_QUERY,
  USER_STATUS_QUERY,
  type QueryPack,
} from './queries.global.js';

export const PROBLEM_LIST_QUERY_CN = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total
      questions {
        frontendQuestionId
        title
        titleCn
        titleSlug
        difficulty
        paidOnly
        acRate
        status
        topicTags {
          name
          nameTranslated
          id
          slug
        }
      }
    }
  }
`;

export const PROBLEM_DETAIL_QUERY_CN = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      boundTopicId
      title
      titleSlug
      content
      translatedTitle
      translatedContent
      difficulty
      isPaidOnly
      acRate
      likes
      dislikes
      isLiked
      similarQuestions
      exampleTestcases
      contributors {
        username
        profileUrl
        avatarUrl
      }
      status
      topicTags {
        name
        slug
        translatedName
      }
      companyTagStats
      codeSnippets {
        lang
        langSlug
        code
      }
      stats
      hints
      solution {
        id
        canSeeDetail
      }
      sampleTestCase
      metaData
      judgerAvailable
      judgeType
      mysqlSchemas
      enableRunCode
      enableTestMode
      libraryUrl
      note
    }
  }
`;

export const DAILY_CHALLENGE_QUERY_CN = `
  query questionOfToday {
    todayRecord {
      date
      userStatus
      question {
        questionId
        frontendQuestionId: questionFrontendId
        difficulty
        title
        titleCn: translatedTitle
        titleSlug
        paidOnly: isPaidOnly
        acRate
        status
        topicTags {
          name
          nameTranslated: translatedName
          id
        }
      }
      lastSubmission {
        id
      }
    }
  }
`;

export const USER_PROFILE_QUERY_CN = `
  query getUserProfile($username: String!) {
    userProfileUserQuestionProgress(userSlug: $username) {
      numAcceptedQuestions {
        count
        difficulty
      }
    }
    userProfilePublicProfile(userSlug: $username) {
      siteRanking
      profile {
        userSlug
        realName
      }
    }
  }
`;

export const SKILL_STATS_QUERY_CN = `
  query skillStats($username: String!) {
    userProfilePublicProfile(userSlug: $username) {
      profile {
        skillSet {
          topicAreaScores {
            score
            topicArea {
              name
              slug
            }
          }
        }
      }
    }
  }
`;

export const CONTEST_LIST_QUERY_CN = `
  query contestHistory($pageNum: Int!, $pageSize: Int) {
    contestHistory(pageNum: $pageNum, pageSize: $pageSize) {
      totalNum
      contests {
        containsPremium
        title
        titleSlug
        description
        startTime
        duration
        originStartTime
        isVirtual
      }
    }
  }
`;

export const CONTEST_DETAIL_QUERY_CN = CONTEST_DETAIL_QUERY_GLOBAL;

export const CN_QUERY_PACK: QueryPack = {
  PROBLEM_LIST_QUERY: PROBLEM_LIST_QUERY_CN,
  PROBLEM_DETAIL_QUERY: PROBLEM_DETAIL_QUERY_CN,
  USER_STATUS_QUERY,
  USER_PROFILE_QUERY: USER_PROFILE_QUERY_CN,
  SKILL_STATS_QUERY: SKILL_STATS_QUERY_CN,
  DAILY_CHALLENGE_QUERY: DAILY_CHALLENGE_QUERY_CN,
  SUBMISSION_LIST_QUERY,
  RANDOM_PROBLEM_QUERY,
  SUBMISSION_DETAILS_QUERY,
  CONTEST_LIST_QUERY: CONTEST_LIST_QUERY_CN,
  CONTEST_DETAIL_QUERY: CONTEST_DETAIL_QUERY_CN,
};

// Export for testing or targeted use
export const CN_FALLBACK_DAILY_QUERY = DAILY_CHALLENGE_QUERY_GLOBAL;
