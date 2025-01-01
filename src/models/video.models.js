import mongoose, {    Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema = new Schema(
    {
        videoFile:{
            type: String,
            required:[true, 'Video file is required'],
        },
        thumbnail:{
            type: String,
            required:[true, 'Thumbnail is required'],
        },
        videoTitle:{
            type:String,
            required:[true, 'Video title is required'],
        },
        videoDescription:{
            type:String,
            required:[true, 'Video description is required'],   
        },
        videoDuration:{
            type:Number,
            required:[true, 'Video duration is required'],
        },
        videoViews:{
            type:Number,
            default:0,
        },
        videoIsPublished:{
            type:Boolean,
            default:true,
        },
        videoOwner:{
            type: Schema.Types.ObjectId,
            ref: 'User',

        },
       
        

    },
    {timestamps:true}
)
videoSchema.plugin(mongooseAggregatePaginate);
export default mongoose.model('Video', videoSchema);


