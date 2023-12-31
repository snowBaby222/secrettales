const Product = require("../models/productModel");
const ErrorHandar = require("../utils/errorhandar");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");

//create product -- only ADMIN can access
exports.createProduct = catchAsyncErrors(async (req, res, next)=>{

    req.body.user = req.user.id;
    const product = await Product.create(req.body);
    res.status(201).json({
        success:true,
        product
    })
});

//GET ALL PRODUCTS
exports.getAllProducts = catchAsyncErrors(async(req, res)=>{
    
    const resultPerPage = 8;
    const productsCount = await Product.countDocuments()
    const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);
    const products = await apiFeature.query;
    res.status(200).json({
        success:true,
        products,
        productsCount,
        resultPerPage
    })
});


//GET PRODUCT DETAILS
exports.getProductDetails = catchAsyncErrors(async(req, res, next)=>{
    const product = await Product.findById(req.params.id);
    if(!product){
        return next(new ErrorHandar("product not found", 404))
    }
    res.status(200).json({
        success:true,
        product,
    })
});

//UPDATE PRODUCTS -- only ADMIN can access
exports.updateProduct = catchAsyncErrors(async(req, res, next)=>{
    let product = await Product.findById(req.params.id);
    if(!product){
        return res.status(500).json({
            success:false,
            message:"Product not found"
        })
    }
    product = await Product.findByIdAndUpdate(req.params.id, req.body,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });
    res.status(200).json({
        success:true,
        product
    })
});

//DELETE PRODUCT
exports.deleteProduct = catchAsyncErrors(async(req, res, next)=>{
    const product = await Product.findById(req.params.id);
    if(!product){
        return res.status(500).json({
            success:false,
            message:"Product not found"
        })
    }
    await product.remove();
    res.status(200).json({
        success:true,
        message:"Product Deleted"
    })
});




//Create new review or update review
exports.createProductReview = catchAsyncErrors(async(req, res, next)=>{
    const {rating, comment, productId} = req.body;
    const review = {
        user:req.user._id,
        name:req.user.name,
        rating:Number(rating),
        comment
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(
        (rev) => rev.user.toString() === req.user._id.toString())

    if(isReviewed){
        product.reviews.forEach(rev=>{
            if(rev.user.toString() === req.user._id.toString())
            rev.rating = rating,
            rev.comment = comment
        })
    }else{
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }
    let avg=0;
    product.reviews.forEach(rev=>{
        avg+=rev.rating
    })
    product.ratings = avg/product.reviews.length;

    await product.save({validateBeforeSave:false});
    res.status(200).json({
        success:true,
    })
})

//get all reviews
exports.getProductReviews = catchAsyncErrors(async(req,res,next)=>{
    const product = await Product.findById(req.query.id);
    if(!product){
        return next(new ErrorHandar("product not found", 404))
    }
    res.status(200).json({
        success:true,
        reviews:product.reviews

    })
})

//delete reviews
exports.deleteReviews = catchAsyncErrors(async(req,res,next)=>{
    const product = await Product.findById(req.query.productId);
    if(!product){
        return next(new ErrorHandar("product not found", 404))
    }

    const reviews = product.reviews.filter(rev=> rev._id.toString() !== req.query.id.toString())
    let avg = 0;
    reviews.forEach(rev=>{
        avg+=rev.rating
    })
    const ratings = avg/reviews.length;
    const numOfReviews = reviews.length;
    await Product.findByIdAndUpdate(req.query.productId,{
        reviews,
        ratings,
        numOfReviews
    },{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true,
        message:"review has been deleted"

    })
})