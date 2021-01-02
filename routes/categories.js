const express = require('express');
const router = express.Router();
const passport = require('passport');
const isEmpty = require("../is-empty");
const Category = require('../models/Category');
router.post('/add', 
//passport.authenticate('jwt', {session: false}), 
async (req, res)=>{
    console.log("req body add category", req.body, req.user);
    const name = !isEmpty(req.body.name) ? req.body.name.toLowerCase() : null;
    const special = !isEmpty(req.body.special) ? req.body.special : false;
    let errors = {};
    if(isEmpty(name)){
        errors.name = "Name is required.";
    }
    if(isEmpty(special)){
        errors.special = "Special is required";
    }
    if(isEmpty(errors)){
        var count = 0;
        try{
            var count = await Category.count({})
            
        }catch(err){
            return res.status(400).json({err: err});
        }
        if(count>0){
            try{
                var resultFind = await Category.findOne({name: name});
                if(resultFind){
                    errors.name = "category name already exists"
                    return res.status(400).json({err: errors});
                }
            }catch(err){
                return res.status(400).json({err: err});
            }
        }
        const cat = new Category();
        cat.name = name;
        cat.special = req.body.special;
        cat.user = req.user.id;
        cat.save().then(ca => {
            Category.find()
            .then(re =>{
                return res.json({data: re});
            })
            .catch(err=>{
                errors.msg = "Can not get categories";
                return res.status(400).json({err: errors})
            });

        })
        .catch(err=>{
            console.log('err ', err);
            errors.msg = "Can not add category";
            return res.status(400).json({err: errors});

        });
    }else{
        return res.status(400).json({err: errors});
    }
    
    
});
router.post('/update', passport.authenticate('jwt', {session: false}), (req, res)=>{
    console.log("req body add category", req.body, req.user);
    const name  = req.body.name.toLowerCase();
    Category.findOne({name: name})
    .then(re2=>{
        if(isEmpty(re2)){
            Category.findOneAndUpdate({_id: req.body._id}, {$set: req.body}, {new: true}, (err, doc) => {
                if (err) {
                    console.log("Something wrong when updating data!");
                    return res.status(400).json({err: "Can not update category"});
                }else{
                    Category.find()
                    .then(re1=>{
                        console.log(re1);
                        return res.json({data: re1});
                    })
                    .catch(err=>{
                        return res.status(400).json({err: "Can get categories"});
                    })
                }
                
                
            });
        }else{
            return res.status(400).json({err: "category updated name exists"});
        }
    });
    
    
});
router.delete('/delete/:id', passport.authenticate('jwt', {session: false}), (req, res)=>{
    let errors ={};
    console.log("req.params.id", req.params);
    const id = !isEmpty(req.params.id) ? req.params.id : null;
    if(isEmpty(id)){
        errors.id = "Category id  is not correct";
    }
    if(isEmpty(errors)){
        Category.findOneAndRemove({'_id' : id}, function (err,offer){
            if(err){
                errors.msg = "Can not delete category";
                return res.status(400).json({err: errors});
            }else{
                Category.find()
                .then(re1=>{
                   
                    return res.json({data: re1});
                })
                .catch(err=>{
                    errors.msg = "Can not get categories";
                    return res.status(400).json({err: errors});
                })
            }
          });
    }else{
        return res.status(400).json({err: errors});
    }
});
router.get('/all', (req, res)=>{
    console.log(
        "all enters"
    )
    Category.find()
    .populate('user')
    .then(re =>{
        //console.log(" re all category ", re);
        return res.json({data: re});
    })
    .catch(err=>{
        let errors = {};
        console.log("category err ", err);
        errors.msg = "Can not get categories";
        return res.status(400).json({err: errors});
    });
});

module.exports = router;