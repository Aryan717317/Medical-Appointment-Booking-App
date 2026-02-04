import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Department from '../models/Department.js';
import Slot from '../models/Slot.js';

dotenv.config();

const departments = [
  { name: 'Cardiology', description: 'Heart and cardiovascular system', icon: '❤️', order: 1 },
  { name: 'Dermatology', description: 'Skin, hair, and nails', icon: '🧴', order: 2 },
  { name: 'Neurology', description: 'Brain and nervous system', icon: '🧠', order: 3 },
  { name: 'Orthopedics', description: 'Bones, joints, and muscles', icon: '🦴', order: 4 },
  { name: 'Pediatrics', description: 'Children and infant care', icon: '👶', order: 5 },
  { name: 'General Medicine', description: 'Primary healthcare', icon: '🩺', order: 6 },
  { name: 'Ophthalmology', description: 'Eye care and vision', icon: '👁️', order: 7 },
  { name: 'ENT', description: 'Ear, nose, and throat', icon: '👂', order: 8 }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Department.deleteMany({}),
      Slot.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create departments
    const createdDepartments = await Department.insertMany(departments);
    console.log('Created departments');

    // Create admin
    const admin = await User.create({
      email: 'admin@medbook.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isVerified: true
    });
    console.log('Created admin: admin@medbook.com / admin123');

    // Create sample doctors
    const doctorData = [
      {
        email: 'dr.smith@medbook.com',
        password: 'doctor123',
        firstName: 'John',
        lastName: 'Smith',
        phone: '+1234567890',
        specialization: 'Cardiologist',
        department: createdDepartments[0]._id,
        consultationFee: 150,
        videoConsultationFee: 120,
        experience: 15,
        bio: 'Experienced cardiologist with over 15 years of practice.',
        qualifications: [
          { degree: 'MD', institution: 'Harvard Medical School', year: 2008 },
          { degree: 'MBBS', institution: 'Johns Hopkins', year: 2005 }
        ]
      },
      {
        email: 'dr.johnson@medbook.com',
        password: 'doctor123',
        firstName: 'Emily',
        lastName: 'Johnson',
        phone: '+1234567891',
        specialization: 'Dermatologist',
        department: createdDepartments[1]._id,
        consultationFee: 100,
        videoConsultationFee: 80,
        experience: 10,
        bio: 'Specialist in skin conditions and cosmetic dermatology.',
        qualifications: [
          { degree: 'MD', institution: 'Stanford Medical School', year: 2013 }
        ]
      },
      {
        email: 'dr.patel@medbook.com',
        password: 'doctor123',
        firstName: 'Raj',
        lastName: 'Patel',
        phone: '+1234567892',
        specialization: 'Neurologist',
        department: createdDepartments[2]._id,
        consultationFee: 200,
        videoConsultationFee: 180,
        experience: 20,
        bio: 'Expert in brain and nervous system disorders.',
        qualifications: [
          { degree: 'MD', institution: 'Yale Medical School', year: 2003 },
          { degree: 'PhD Neuroscience', institution: 'MIT', year: 2000 }
        ]
      }
    ];

    for (const data of doctorData) {
      const { email, password, firstName, lastName, phone, ...doctorProfile } = data;
      
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: 'doctor',
        isVerified: true
      });

      const doctor = await Doctor.create({
        user: user._id,
        ...doctorProfile,
        isVerified: true,
        availability: {
          monday: { start: '09:00', end: '17:00', isAvailable: true },
          tuesday: { start: '09:00', end: '17:00', isAvailable: true },
          wednesday: { start: '09:00', end: '17:00', isAvailable: true },
          thursday: { start: '09:00', end: '17:00', isAvailable: true },
          friday: { start: '09:00', end: '15:00', isAvailable: true },
          saturday: { start: '10:00', end: '14:00', isAvailable: false },
          sunday: { start: '', end: '', isAvailable: false }
        }
      });

      // Create slots for next 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
        
        if (!doctor.availability[dayOfWeek]?.isAvailable) continue;

        const slots = [
          { startTime: '09:00', endTime: '09:30' },
          { startTime: '09:30', endTime: '10:00' },
          { startTime: '10:00', endTime: '10:30' },
          { startTime: '10:30', endTime: '11:00' },
          { startTime: '11:00', endTime: '11:30' },
          { startTime: '14:00', endTime: '14:30' },
          { startTime: '14:30', endTime: '15:00' },
          { startTime: '15:00', endTime: '15:30' },
          { startTime: '15:30', endTime: '16:00' }
        ];

        for (const slot of slots) {
          await Slot.create({
            doctor: doctor._id,
            date,
            ...slot
          });
        }
      }

      console.log(`Created doctor: ${email} / doctor123`);
    }

    // Create sample patient
    const patientUser = await User.create({
      email: 'patient@example.com',
      password: 'patient123',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+1234567899',
      role: 'patient',
      isVerified: true
    });

    await Patient.create({
      user: patientUser._id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'female',
      bloodGroup: 'A+',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    });
    console.log('Created patient: patient@example.com / patient123');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('================');
    console.log('Admin: admin@medbook.com / admin123');
    console.log('Doctor: dr.smith@medbook.com / doctor123');
    console.log('Patient: patient@example.com / patient123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
