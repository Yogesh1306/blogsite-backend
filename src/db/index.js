import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_Name}`,
    );
    console.log(
      "Connected to MongoDb\nhost: ",
      connectionInstance.connection.host,
    );
  } catch (error) {
    console.log("Failed to connect to Mongodb:\n", error);
  }
};

export { connectDb };
