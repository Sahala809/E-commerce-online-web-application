export const loadSignup = ( req, res) => {
    res.render("auth/singup")
}

export const signup = async ( req, res) => {
    console.log(req.body)
    res.send("signup successful")
}