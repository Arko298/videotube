const asyncHandler = (err, res, next) => {
    return (req,res,next)=>{
        Promise.resolve(requestHandler(err, res, next)).catch((err) => {
            next(err);
        });
    }
}
export default asyncHandler;