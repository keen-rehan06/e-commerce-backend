
export const createReview = async(req,res) => {
    try {
      const productId = req.params.id;
      const {orderId,rating,comment} = req.body;
      const userId = req.user.id;
      
      if(!orderId || !rating || !comment) return res.status(401).send({message:"All fields are required!",success:false});

      const product = await productModel.findById(producId);
    } catch (error) {
        
    }
}