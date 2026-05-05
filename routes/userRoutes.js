const express = require('express');
const router = express.Router();
const {
  loginUser,
  registerUser,
  signUpWithProvider,
  verifyEmailAddress,
  emailVerify,
  resendVerificationEmail,
  userRegister,
  forgetPassword,
  changePassword,
  personalInfo,
  certificate,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUser,
  userUpdate,
  updateTempUser,
  deleteUser,
  getQuestionnaire,
  getAllQuestionnaire,
  getAllFreeCultureQuestionnaire,
  getAllFreeClassicalQuestionnaire,
  getAllPaidCultureQuestionnaire,
  getAllPaidClassicalQuestionnaire,
  answerQuestionnaire,
  getAnswers,
  getAllAnswers,
  getiqresult,
  testcount,
  gettestcount,
  userdata,
  allUserReport,
  userReport,
  getAllEnnaQuestionnaire,
  getEnnaQuestionnaire,
  getBooking,
  save_question,
  get_answers,
  get_count,
  get_result,
  userEnneagramReport,
  getSixteentypeQuestionnaire,
  get_sixteentype_count,
  getAllsixteentypequestionnaire,
  get_sixteentype_answers,
  get_sixteentype_result,
  userSixteenTypeReport,
  getAllBigFIveType,
  getBigFIveQuestionnaire,
  get_bigfive_result,
  testPdfCreate,
  userBigFiveReport,
  get_bigfive_count,
  get_bigfive_answers,
  getAllDiscType,
  getDiscQuestionnaire,
  get_disc_result,
  get_disc_count,
  get_disc_answers,
  userDiscReport,
  getAllCareerAptitude,
  getCareerAptitudeQuestionnaire,
  get_careeraptitude_result,
  generate_careeraptitude_report,
  get_careeraptitude_count,
  get_careeraptitude_answers,
  userCareerAptitudeReport,
  getCultureTestResult,
  get30FreeClassicalTestResult,
  addWindowStep,
  getWindowStep,
  updateWindowStep,
  getFinalScore,
  generateCertificatesAndReports,
  getFinalClassicalScore,
  generateCertificatesAndReportsForClassical
} = require('../controller/userController');
const {
  passwordVerificationLimit,
  emailVerificationLimit,
} = require('../config/others');
const authentication = require('../config/authentication');

//verify email
router.post('/verify-email', verifyEmailAddress);

//register a user
router.post('/register/:token', registerUser);

router.post('/email-verify', emailVerify);
router.post('/resendVerificationEmail', resendVerificationEmail);
router.post('/user-register/:token', userRegister);

//login a user
router.post('/login', loginUser);

//register or login with google and fb
router.post('/signup', signUpWithProvider);

//forget-password
router.put('/forget-password', passwordVerificationLimit, forgetPassword);

//reset-password
router.put('/reset-password', resetPassword);

//change password
router.post('/change-password', authentication, changePassword);

router.post('/personal-info/', authentication, personalInfo);

//get aall questionnaire
router.get('/get-all-questionnaire/', getAllQuestionnaire);

router.get('/get-all-free-culture-questionnaire/', getAllFreeCultureQuestionnaire);
router.get('/get-all-free-classical-questionnaire/', getAllFreeClassicalQuestionnaire);
router.get('/get-all-paid-culture-questionnaire/', getAllPaidCultureQuestionnaire);
router.get('/get-all-paid-classical-questionnaire/', getAllPaidClassicalQuestionnaire);

router.post('/get-questionnaire-count', get_sixteentype_count);
router.post('/save_sixteentype_answer', get_sixteentype_result);
router.get('/get-all-big-five-type-questionnaires', getAllBigFIveType);
router.get('/get-big-five-type-questionnaires/:id', getBigFIveQuestionnaire);
router.post('/get-result-big-five', get_bigfive_result);
router.post('/get-bigfive-count', get_bigfive_count);
router.post('/get-bigfive-ansers', get_bigfive_answers);

router.get('/get-all-disc-questionnaires', getAllDiscType);
router.get('/get-disc-questionnaires/:id', getDiscQuestionnaire);
router.post('/get-result-disc', get_disc_result);
router.post('/get-disc-count', get_disc_count);
router.post('/get-disc-ansers', get_disc_answers);
router.post('/user-disc-personality-reports', userDiscReport);

router.get('/get-all-career-aptitude-questionnaires', getAllCareerAptitude);
router.get('/get-career-aptitude-questionnaires/:id', getCareerAptitudeQuestionnaire);
router.post('/get-career-aptitude-result', get_careeraptitude_result);
router.post('/generate-career-aptitude-report', generate_careeraptitude_report);
router.post('/get-career-aptitude-count', get_careeraptitude_count);
router.post('/get-career-aptitude-ansers', get_careeraptitude_answers);
router.post('/user-career-aptitude-reports', userCareerAptitudeReport);

//count answer (is_correct)
// router.post('/correct-answers/', correctAnswers);

router.post('/get-classical-final-score', getFinalClassicalScore);
router.post('/get-final-score', getFinalScore);
router.post('/generate-certificates-reports', generateCertificatesAndReports);
router.post('/generate-classical-certificates-reports', generateCertificatesAndReportsForClassical);
router.post('/certificate/', certificate);
router.post('/culture-faire-test-result', getCultureTestResult);
router.post('/classical-faire-test-result', get30FreeClassicalTestResult);
router.post('/all-user-report', allUserReport);
router.get('/user-report/:report_id', userReport);

router.post('/getiqresult/', getiqresult);

router.post('/testcount', testcount);
router.post('/gettestcount', gettestcount);

router.post('/create-window-step', addWindowStep);
router.post('/get-window-step', getWindowStep);
router.post('/update-window-step', updateWindowStep);

router.get('/get-all-enneagram-questionnaires', getAllEnnaQuestionnaire);
router.get('/get-all-sixteentype-questionnaires', getAllsixteentypequestionnaire);
router.get('/get-enneagramquestionnaire/:id', getEnnaQuestionnaire);
router.get('/get-sixteentypequestionnaire/:id', getSixteentypeQuestionnaire);
router.post('/create_booking', getBooking);
router.post('/save_answer', save_question);
router.post('/get_ansers', get_answers);
router.post('/get-16type-ansers', get_sixteentype_answers);
router.post('/get_count', get_count);
router.post('/get_result', get_result);
router.post('/user-enneagram-reports', userEnneagramReport);
router.post('/user-sixteen-type-personality-reports', userSixteenTypeReport);
router.post('/user-big-five-personality-reports', userBigFiveReport);

//get all user
router.get('/', getAllUsers);

//get a user
router.get('/:id', getUserById);

//update a user
router.put('/:id', updateUser);

router.put('/userUpdate/:id', userUpdate);
router.put('/update-temp-user/:id', updateTempUser);

//delete a user
router.delete('/:id', deleteUser);

//get a questionnaire by type
router.get('/get-questionnaire/:id', getQuestionnaire);

//add and update a answer-questionnaire
router.post('/answer-questionnaire', answerQuestionnaire);

// router.get('/get-answers/:id/:answer_type', authentication, getAnswers);
router.post('/get-answers', getAnswers);

router.post('/get-all-answers', getAllAnswers);

// router.get('/get-all-questionnaire-answer/:type/:booking_id', getAllQuestionnaireAnswer);

router.post('/userdata', userdata);

router.post('/testPdfCreate', testPdfCreate);

module.exports = router;
