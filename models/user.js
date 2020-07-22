const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
        email: {
            type: String,
            required:true
        },
        password:{
            type:String,
            required:true
        },
        resetToken:String,

        resetTokenExpiration:Date
        ,
        projects: [{
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Project'
                }
            }]
})

userSchema.method.addproject=function (project){
    const projectIndex=this.projects.findIndex(p=>{
        return p._id.toString()===project._id.toString()
    })
    const newprojects=[];
    //if exists do not add it again 
    if (projectIndex=>0){
        return newprojects=[...this.projects]
    }
    else if (projectIndex<0){
        return newprojects=[...this.projects,project]

    } 
    // this.projects=newprojects
    console.log(newprojects)
    return this.save();
}
module.exports = mongoose.model('User', userSchema)
