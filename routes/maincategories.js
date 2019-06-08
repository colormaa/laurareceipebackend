const express = require('express');
const router = express.Router();
const passport = require('passport');
const isEmpty = require("../is-empty");
const MainCategory = require('../models/MainCat');
router.post('/add', passport.authenticate('jwt', {session: false}), (req, res)=>{
    console.log("req body add main category", req.body, req.user);
    
    const name = !isEmpty(req.body.name) ? req.body.name.toLowerCase() : null;
    const categories = !isEmpty(req.body.categories) ? req.body.categories : [];
    let errors = {};
    if(isEmpty(name)){
        errors.name = "Name is required.";
    }
    
    if(isEmpty(errors)){
        MainCategory.findOne({name: name})
        .then(result =>{
            if(result){
                console.log("main category result", result);
                errors.name = "main category name already exists"
                return res.status(400).json({err: errors});
            }else{
                const cat = new MainCategory();
                cat.name = name;
                cat.categories = categories;
                cat.user = req.user.id;
                cat.save().then(ca => {
                    console.log("main cat ", ca);
                    MainCategory.find()
                    .populate('categories')
                    .then(re =>{
                        return res.json({data: re});
                    })
                    .catch(err=>{
                        errors.msg = "Can not get main categories";
                        return res.status(400).json({err: errors});
                    });
                    
                })
                .catch(err=>{
                    console.log('err ', err);
                    errors.msg = "Can not add main category";
                    return res.status(400).json({err: errors});
                    
                });
            }
        });
    }else{
        return res.status(400).json({err: errors});
    }
});
router.get('/all', passport.authenticate('jwt', {session: false}),(req, res)=>{
    console.log("all enters");
    //return res.status(400).json({err: "hi err"});
    MainCategory.find()
    .populate('categories')
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
router.post('/update', passport.authenticate('jwt', {session: false}), (req, res)=>{
    console.log("req body update main category", req.body, req.user);
    const name  = req.body.name.toLowerCase();
    MainCategory.findOne({_id: req.body._id})
    .then(re2=>{
        if(isEmpty(re2)){
            return res.status(400).json({err: "main category updated name does not  exists "});
        }else{
            if(re2.name.toLowerCase() === name){

                MainCategory.findOneAndUpdate({_id: req.body._id}, {$set: req.body}, {new: true}, (err, doc) => {
                    if (err) {
                        console.log("Something wrong when updating data!");
                        return res.status(400).json({err: "Can not update category"});
                    }else{
                        MainCategory.find()
                        .populate('categories')
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
                MainCategory.findOne({name: req.body.name})
                .then(re2 =>{
                    if(isEmpty(re2)){
                        MainCategory.findOneAndUpdate({_id: req.body._id}, {$set: req.body}, {new: true}, (err, doc) => {
                            if (err) {
                                console.log("Something wrong when updating data!");
                                return res.status(400).json({err: "Can not update category"});
                            }else{
                                MainCategory.find()
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
                })
            }
            
        }
    });
});

router.delete('/delete/:id', passport.authenticate('jwt', {session: false}), (req, res)=>{
    let errors ={};
    console.log("req.params.id", req.params);
    const id = !isEmpty(req.params.id) ? req.params.id : null;
    if(isEmpty(id)){
        errors.id = "main Category id  is not correct";
    }
    if(isEmpty(errors)){
        MainCategory.findOneAndRemove({'_id' : id}, function (err,offer){
            if(err){
                errors.msg = "Can not delete main category";
                return res.status(400).json({err: errors});
            }else{
                MainCategory.find()
                .populate('categories')
                .then(re1=>{
                   
                    return res.json({data: re1});
                })
                .catch(err=>{
                    errors.msg = "Can not get main categories";
                    return res.status(400).json({err: errors});
                })
            }
          });
    }else{
        return res.status(400).json({err: errors});
    }
});
module.exports = router;