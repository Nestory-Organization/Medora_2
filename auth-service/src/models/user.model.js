const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Emergency contact name is required']
    },
    phone: {
      type: String,
      trim: true,
      required: [true, 'Emergency contact phone is required'],
      match: [/^\+?[0-9\s()-]{7,20}$/, 'Please provide a valid emergency contact phone number']
    },
    relationship: {
      type: String,
      trim: true,
      required: [true, 'Emergency contact relationship is required']
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    firstName: {
      type: String,
      required: [true, 'First name is required']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required']
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient'
    },
    phone: {
      type: String,
      default: null
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    bloodType: {
      type: String,
      enum: {
        values: BLOOD_TYPES,
        message: 'Invalid blood type: {VALUE}'
      },
      default: null
    },
    allergies: {
      type: [String],
      default: [],
      validate: {
        validator: (values) => Array.isArray(values) && values.every((item) => typeof item === 'string' && item.trim().length > 0),
        message: 'Allergies must be a list of non-empty strings'
      }
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    specialization: {
      type: String,
      default: null
    },
    licenseNumber: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// Remove password from response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
