import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_secret: process.env.CLOUD_SECRET,
    api_key: process.env.CLOUD_API_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder: 'uploads'
        })
        fs.unlinkSync(localFilePath)
        return response
        
    } catch (error) {
        console.log('Error uploading to cloudinary', error)
        fs.unlinkSync(localFilePath)
        return null
    }
    const deleteFromCloudinary = async (publicId) => {
        try {
            await cloudinary.uploader.destroy(publicId)
            console.log()
        } catch (error) {
            console.log('Error deleting from cloudinary', error)
            return null;
        }
        
    }

}
export default {uploadOnCloudinary, deleteFromCloudinary };