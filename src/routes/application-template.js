const express = require('express');
const ApplicationTemplateController = require('../controllers/application-template');
const multer = require('multer');

const router = express.Router();
const templateController = new ApplicationTemplateController();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * @route POST /api/application-template/create
 * @desc Create new application folder and template
 * @access Public
 * @body { applicationNumber: string }
 */
router.post('/create', async (req, res) => {
    await templateController.createApplication(req, res);
});

/**
 * @route PUT /api/application-template/:applicationNumber/stage1
 * @desc Update application with Stage 1 data
 * @access Public
 * @params applicationNumber - The application number
 * @body Stage 1 data object
 */
router.put('/:applicationNumber/stage1', async (req, res) => {
    await templateController.updateStage1Data(req, res);
});

/**
 * @route PUT /api/application-template/:applicationNumber/stage2
 * @desc Update application with Stage 2 data
 * @access Public
 * @params applicationNumber - The application number
 * @body Stage 2 data object
 */
router.put('/:applicationNumber/stage2', async (req, res) => {
    await templateController.updateStage2Data(req, res);
});

/**
 * @route PUT /api/application-template/:applicationNumber/third-party
 * @desc Update application with third-party data
 * @access Public
 * @params applicationNumber - The application number
 * @body Third-party data object
 */
router.put('/:applicationNumber/third-party', async (req, res) => {
    await templateController.updateThirdPartyData(req, res);
});

/**
 * @route PUT /api/application-template/:applicationNumber/processing/:stageName
 * @desc Update processing stage data
 * @access Public
 * @params applicationNumber - The application number
 * @params stageName - The processing stage name
 * @body Processing stage data object
 */
router.put('/:applicationNumber/processing/:stageName', async (req, res) => {
    await templateController.updateProcessingStage(req, res);
});

/**
 * @route GET /api/application-template/:applicationNumber
 * @desc Get complete application data
 * @access Public
 * @params applicationNumber - The application number
 */
router.get('/:applicationNumber', async (req, res) => {
    await templateController.getApplicationData(req, res);
});

/**
 * @route GET /api/application-template/:applicationNumber/summary
 * @desc Get application summary
 * @access Public
 * @params applicationNumber - The application number
 */
router.get('/:applicationNumber/summary', async (req, res) => {
    await templateController.getApplicationSummary(req, res);
});

/**
 * @route GET /api/application-template/list/all
 * @desc List all applications
 * @access Public
 */
router.get('/list/all', async (req, res) => {
    await templateController.listApplications(req, res);
});

/**
 * @route POST /api/application-template/:applicationNumber/document
 * @desc Save document to application folder
 * @access Public
 * @params applicationNumber - The application number
 * @body { documentType: string, filename: string, documentData: buffer }
 */
router.post('/:applicationNumber/document', upload.single('document'), async (req, res) => {
    await templateController.saveDocument(req, res);
});

module.exports = router;