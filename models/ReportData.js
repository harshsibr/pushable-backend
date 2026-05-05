const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportDataSchema = new Schema(
    {
        user_id: {
            type: String,
        },
        questionnaire_id: {
            type: String
        },
        unique_id: {
            type: String
        },
        reportName: {
            type: String
        },
        noofcurrectans: {
            type: Number
        },
        Qcountt: {
            type: Number
        },
        percentile: {
            type: Number
        },
        score: {
            type: Number
        },
        lessScore: {
            type: Number
        },
        greaterScore: {
            type: Number
        },
        scoreurl1: {
            type: String
        },
        scoreurl2: {
            type: String
        },
        category: {
            type: Object
        },
        reportUrl: {
            type: String
        },
        certificateData: {
            type: Object
        },
        invoice_number: {
            type: String,
        },
        payment_status: {
            reportPaymentStatus: Boolean,
            certificatePaymentStatus: Boolean
        },
        paymentMethods: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('ReportData', ReportDataSchema);