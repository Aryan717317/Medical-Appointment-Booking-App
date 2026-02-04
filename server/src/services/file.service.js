import PDFDocument from 'pdfkit';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3.js';

export const generatePrescriptionPDF = async (prescription, doctor, patient) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).fillColor('#2563eb').text('MedBook', { align: 'center' });
      doc.fontSize(12).fillColor('#6b7280').text('Medical Appointment Booking System', { align: 'center' });
      doc.moveDown();

      // Line
      doc.strokeColor('#e5e7eb').lineWidth(1)
        .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Prescription Header
      doc.fontSize(18).fillColor('#111827').text('Prescription', { align: 'center' });
      doc.moveDown();

      // Doctor Info
      doc.fontSize(12).fillColor('#374151');
      const doctorName = doctor.user ? 
        `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 
        'Doctor';
      doc.text(`Doctor: ${doctorName}`);
      doc.text(`Specialization: ${doctor.specialization || 'General'}`);
      doc.moveDown();

      // Patient Info
      const patientName = `${patient.firstName} ${patient.lastName}`;
      doc.text(`Patient: ${patientName}`);
      doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
      doc.moveDown();

      // Line
      doc.strokeColor('#e5e7eb').lineWidth(1)
        .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Diagnosis
      doc.fontSize(14).fillColor('#2563eb').text('Diagnosis');
      doc.fontSize(12).fillColor('#374151').text(prescription.diagnosis);
      doc.moveDown();

      // Medications
      doc.fontSize(14).fillColor('#2563eb').text('Medications');
      doc.moveDown(0.5);

      prescription.medications.forEach((med, index) => {
        doc.fontSize(12).fillColor('#111827').text(`${index + 1}. ${med.name}`);
        doc.fontSize(10).fillColor('#6b7280')
          .text(`   Dosage: ${med.dosage} | Frequency: ${med.frequency} | Duration: ${med.duration}`);
        if (med.instructions) {
          doc.text(`   Instructions: ${med.instructions}`);
        }
        doc.moveDown(0.5);
      });
      doc.moveDown();

      // Tests (if any)
      if (prescription.tests && prescription.tests.length > 0) {
        doc.fontSize(14).fillColor('#2563eb').text('Recommended Tests');
        prescription.tests.forEach((test, index) => {
          doc.fontSize(12).fillColor('#374151').text(`${index + 1}. ${test.name}`);
          if (test.instructions) {
            doc.fontSize(10).fillColor('#6b7280').text(`   ${test.instructions}`);
          }
        });
        doc.moveDown();
      }

      // Advice
      if (prescription.advice) {
        doc.fontSize(14).fillColor('#2563eb').text('Advice');
        doc.fontSize(12).fillColor('#374151').text(prescription.advice);
        doc.moveDown();
      }

      // Follow-up
      if (prescription.followUpDate) {
        doc.fontSize(12).fillColor('#dc2626')
          .text(`Follow-up Date: ${new Date(prescription.followUpDate).toLocaleDateString()}`);
      }

      // Footer
      doc.moveDown(2);
      doc.strokeColor('#e5e7eb').lineWidth(1)
        .moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(10).fillColor('#9ca3af')
        .text('This is a computer-generated prescription. Please consult your doctor for any clarifications.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const uploadToS3 = async (buffer, key, contentType = 'application/pdf') => {
  const bucket = process.env.AWS_S3_BUCKET;

  if (!bucket) {
    console.log('S3 not configured, skipping upload');
    return null;
  }

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }));

    // Generate signed URL
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 604800 } // 7 days
    );

    return url;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

export const getPresignedUploadUrl = async (key, contentType) => {
  const bucket = process.env.AWS_S3_BUCKET;

  if (!bucket) {
    throw new Error('S3 not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min
  return url;
};
