import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dob: { type: Date, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    username: { type: String, required: true, unique: true },
    address: {
        state: String,
        city: String,
        country: String,
        zipcode: String
    },
    socials: { type: Map, of: String },
    status: {
        type: String,
        enum: ['verified', 'unverified', 'deleted'],
        default: 'unverified'
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'owner'],
        default: 'user'
    }
}, { timestamps: true });


userSchema.pre('save', async function (next) {
    try {
        // Hash password if modified
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }



        // Username Handling
        if (this.isNew || this.isModified('username')) {
            if (this.username) {
                // User provided username → check uniqueness
                const exists = await mongoose.models.User.findOne({ username: this.username, _id: { $ne: this._id } });
                if (exists) {
                    return next(new Error('Username already exists.'));
                }
            } else {
                // Auto-generate username
                let baseUsername = `${this.firstname.toLowerCase()}${this.lastname.toLowerCase()}`;
                let username = baseUsername;
                let exists = await mongoose.models.User.findOne({ username });

                while (exists) {
                    const randomNum = Math.floor(1000 + Math.random() * 9000);
                    username = `${baseUsername}${randomNum}`;
                    exists = await mongoose.models.User.findOne({ username });
                }

                this.username = username;
            }
        }

        next();
    } catch (err) {
        console.error(err.message);
        next(err);
    }
});


/** Method to compare password */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.pass);
};

const User = model('User', userSchema);

export default User;
