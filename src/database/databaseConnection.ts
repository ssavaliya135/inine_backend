import mongoose, { ConnectOptions } from 'mongoose';

const mongoUrl = process.env.DB_URL;

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(mongoUrl, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
        dbName: process.env.DB_NAME,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        
    } as ConnectOptions); // Type assertion here
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};
