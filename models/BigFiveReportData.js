const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BigFiveDataSchema = new Schema(
    {
        user_id: {
            type: String,
        },
        questionnaire_id: {
            type: String
        },
        booking_id: {
            type: String
        },
        unique_id: {
          type: String
        },
        reportName: {
            type: String
        },
        user_name: {
            type: String
        },
        last_name: {
            type: String
        },
        email: {
            type: String
        },
        gender: {
            type: String
        },
        age: {
            type: String
        },
        country: {
            type: String
        },
        invoiceUrl: {
            type: String
        },
        qualification: {
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
        report_status: {
            type: Boolean,
            default:false
        },
        invoice_number: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('BigFiveReportData', BigFiveDataSchema);