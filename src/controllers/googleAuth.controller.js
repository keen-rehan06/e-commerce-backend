
export const profile = async (req, res) => {
  res.send({name:req.user.displayName,image:req.user.photos[0].value});
};

export const logout = async (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send({
        message: "Logout failed",
        success: false,
      });
    }
    res.redirect("/");
  });
};