const fs=require('fs')

exports.deleteFile=(file)=>{
    fs.unlink(file,(err)=>{
        if(err){
            console.log(err)
        }
        else{
            console.log('File deleted Succfully')
        }
    })
}