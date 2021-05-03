const express = require('express');
const cheerio = require('cheerio');
const router = express.Router();
const passport = require('passport');
const Recipe = require("../models/Recipe");
const Category = require('../models/Category');
const request = require('request');
const isEmpty = require('../is-empty');
const mongoose = require('mongoose');
var ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl-exec')
const fs  = require('fs');
router.get('/download', (req, res)=>{
    
    var url = req.query.url;
    var title = req.query.title;
    console.log('download ===== ', url, title);
    //res.header('Content-Disposition', `attachment; filename=${title}.mp4`);
    
    //ytdl(url, {format: 'mp4'}).pipe(fs.createWriteStream('Video test.mp4'));
    //ytdl('http://www.youtube.com/watch?v=A02s8omM_hI')
    //.pipe(fs.createWriteStream('video.flv'));


    ///var url = req.query.url;    
    /*res.header("Content-Disposition", `attachment;\  filename=${title}.mp4`);    
    ytdl(url, {format: 'mp4'}).pipe(res);*/
    const video = youtubedl('https://www.youtube.com/watch?v=BzE1mX4Px0I',
    // Optional arguments passed to youtube-dl.
    ['--format=18'],
  )
   
  // Will be called when the download starts.
  video.on('info', function(info) {
    console.log('Download started')
    console.log('filename: ' + info._filename)
    console.log('size: ' + info.size)
  })
   
  video.pipe(fs.createWriteStream('myvideo.mp4'))
})
async function getPageNumber(category){
    return new Promise(function(resolve, reject){
        const pagenumbers =[];
        request(`http://www.laurainthekitchen.com/recipe-category.php?screen=2&category=${category}`, (err, response, html)=>{
        if(!err && response.statusCode == 200){
            
            var $ = cheerio.load(html);
                $('ul.page-numbers li').each((i, element)=>{
                    const $element = $(element);
                    //console.log("element", $element.get(0).children[0].children[0].data);
                    const temp = $element.get(0).children[0].children[0].data;
                    if(parseInt(temp)){
                        
                        pagenumbers.push(parseInt(temp));
                    }
                });
                
                //console.log("page number", pagenumbers);
                resolve(pagenumbers);
            
        }else{
            console.log(" err");
            reject([]);
        }
        
    });
    });
}
async function saveRecipeTitle(obj){
    const find = await Recipe.findOne({link: obj.link});
     //.log("find recipe ", find ? find.link: 'notfound');
     
    if(!isEmpty(find)){
        //console.log("exists ", find.category, obj.category);
        //find.category.push(obj.category);
        
        if(!find.category.includes(obj.category)){
            const recip =await  Recipe.update(
                { link: obj.link}, 
                { $push: { category: obj.category}}
                
            );
            console.log("recipe update ", recip)
        }
        return find._id;
        
    }else{
        //console.log("saved ", obj.category);
        let tempobj = {
            image: "https://www.laurainthekitchen.com/"+obj.image, 
            link: obj.link, 
            title: obj.title, 
            serves: obj.serves, 
            seen: obj.seen, 
            category: [obj.category]
        }
        //tempobj.category=["aassa"]
        //console.log("unshift ", tempobj);
        
        const recip =  await new Recipe(tempobj).save(); 
       // console.log("resipc ", recip._id); 
        return recip;   
    }
}
async function parseRecipeTitle(html, id){
    
        var $ = cheerio.load(html);
              const parse = []; 

              //console.log("parse +++ ", $('ul.cs-recipes').get(0));
              
               await $('ul.cs-recipes li.cs-recipe').each( async(i, element)=>{
                const $element = $(element);

                const image = $element.find('a img').get(0).attribs['data-cfsrc'];
                const link = $element.find('h3 a').get(0).attribs['href'];
                const title = $element.find('h3 a').get(0).children[0].data;
                const serves = $element.find('.cs-recipe-meta span').get(0).children[1].data;
                const seen = $element.find('.cs-recipe-meta span').get(1).children ? parseInt($element.find('.cs-recipe-meta span').get(1).children[1].data.split(' ')[1].replace(/\,/g, '')): 0;
                //console.log("name", title1);
                const obj = {
                    image: image, 
                    link: link, 
                    title: title, 
                    serves: serves, 
                    seen: seen, 
                    category: id, 
                    
                }
                parse.push(obj);
                //console.log("================================+++++++++++++++++++++++++=", obj);
                
            });
            return parse;
}
function delay(e, category){
   return new Promise(function(resolve, reject){
       console.log("category ", category);
    request(`http://www.laurainthekitchen.com/recipe-category.php?screen=${e}&category=${category}`,
    async  (err, response, html)=>{
    if(!err && response.statusCode == 200){
        //console.log("body oke  =>     ", e);
       
        //console.log("after parse await");
        resolve(html);
    }else{
        console.log("err");
        reject();
    }

});
   });
}
async function delaylog(e, category){
    const res = await delay(e, category.name);
    //console.log("res ponse")
    const val = await parseRecipeTitle(res, category._id);
     await recipetitleloop(val);
    return e;
    //console.log("delay log", val);
}
router.get('/parse/titlenum/', async (req, res)=>{
    const number = !isNaN(parseInt(req.query.number)) ? parseInt(req.query.number) : 1;
    const title = req.query.title ? req.query.title: 'breakfast';
    Category.findOne({name: title}).then(async re=>{
        const result = await delaylog(number, re);
        return res.json({data: result});
    })
    .catch(err=>{
        return res.status(400).json({errors: number});
    })
    //await delaylog(number, title)
    
})
async function recipetitleloop(val){
    for(const el of val){
        //console.log("console log el ", el.link);
        const recipid = await saveRecipeTitle(el);
        console.log("console log after save recipe title  ", el, recipid);
    }
}
async function looppagenumber(ret, category,){
    //console.log("re   ret", ret);
    for(const el of ret){
        //console.log("console log el ", el);
        await delaylog(el, category);
        //console.log("console log el ", el);
    }
}
async function loopcategories(cats){
    for(const cat of cats){
        console.log("categories ", cat);
        const category = cat.name;
        const ret = await getPageNumber(category);
    
        console.log("ret ", ret);
        await looppagenumber(ret, cat);
    }
}
router.get('/all', async(req, res)=>{
    console.log("all pages ", req.query.page);
    const page = isNaN(parseInt(req.query.page))|| parseInt(req.query.page)===0 ? 1: parseInt(req.query.page);
    const limit = isNaN(parseInt(req.query.limit))|| parseInt(req.query.limit)===0 ? 20: parseInt(req.query.limit);
    const search = !isEmpty(req.query.search)?  req.query.search: null;
    console.log("all page limit search ", page, limit);
    if(search){
        Recipe.find({$text: {$search: search}}, {score: {$meta: 'textScore'}})
        .sort({score: {$meta: 'textScore'}})
        .then(count=>{
            console.log("count ", count.length);
            Recipe.find({$text: {$search: search}}, {score: {$meta: 'textScore'}})
            .sort({score: {$meta: 'textScore'}})
            .populate('category')
            .skip((page-1) * limit)
            .limit(limit)
            .then( async re=>{
                console.log(
                    "recipes  ", re.length
                )
                await res.json({data: {count: count.length, recipes: re}});
            })
            .catch(err=>{
                let errors = {};
                errors.msg  = "Can not get recipes";
                return res.status(400).json({err: errors})
            });

        })
        .catch(err=>{
            console.log("err, ", err);
        })
    }else{
        Recipe.count({}, function(err, count){
            if(err){
                let errors = {};
                errors.msg  = "Can not get recipes";
                return res.status(400).json({err: errors})
            }
            Recipe.find().populate('category')
            .skip((page-1) * limit)
            .limit(limit)
            .then( async re=>{
                console.log(
                    "recipes  ", re.length
                )
                await res.json({data: {count: count, recipes: re}});
            })
            .catch(err=>{
                let errors = {};
                errors.msg  = "Can not get recipes";
                return res.status(400).json({err: errors})
            });

        });
    }
});
router.get('/delete/:id', passport.authenticate('jwt', {session: false}), (req, res)=>{
    console.log("router delete ", req.params.id);
    const errors = {};
    const id = req.params.id ? req.params.id: null;
    if(isEmpty(id)){
        errors.id = "id is required";
        console.log("is id empty");
        return res.status(400).json({err: errors});
    }else{
        Recipe.findOneAndRemove({_id: id})
            .then((docs)=>{
                if(docs) {
                //resolve({"success":true,data:docs});
                console.log("Usr find one and remove ");
                
                    Recipe.find().populate('category')
                    .skip(0)
                    .limit(20)
                    .then(recfind =>{
                        console.log("return data ", recfind.length);
                        return res.json({data: {count: recfind.length, recipes: recfind}});
                    })
                    .catch(err=>{
                        console.log("here 0")
                        errors.msg = "Can not get recipes";
                        return res.status(400).json({err: errors});
                    })
                } else {
                    console.log("hre1");
                    errors.msg = "no recipe exist with such id";
                    return res.status(400).json({err: errors});
                //reject({"success":false,data:"no such user exist"});
                }
        }).catch((err)=>{
            //reject(err);
            console.log("here 3 ", err);
            errors.msg = "find one and remove ";
            return res.status(400).json({err: errors});
        });
        console.log("err withing else  ");
    }
});
router.post('/update', passport.authenticate('jwt', {session: false}), (req, res)=>{
    console.log("update ");
    const recipe = {};
    const errors = {};
    if(isEmpty(req.body.link)){
        errors.link = "recipe link not found."
    }else{
        recipe.link = req.body.link;
    }
    if(isEmpty(req.body._id)){
        errors._id = "recipe _id not found."
    }else{
        recipe._id = req.body._id;
    }
    if(isEmpty(req.body.cooktime)){
        errors.cooktime = "recipe cooktime not found."
    }else{
        recipe.cooktime = req.body.cooktime;
    }
    if(isEmpty(req.body.serves)){
        errors.serves = "recipe serves not found."
    }else{
        recipe.serves = req.body.serves;
    }
    if(isEmpty(req.body.preparation)){
        errors.preparation = "recipe preparation not found."
    }else{
        recipe.preparation = req.body.preparation;
    }
    if(isEmpty(req.body.preinstruction)){
        errors.preinstruction = "recipe preinstruction not found."
    }else{
        recipe.preinstruction = req.body.preinstruction;
    }
    if(isEmpty(req.body.category)){
        errors.category = "recipe category not found."
    }else{
        recipe.category = req.body.category;
    }
    if(isEmpty(req.body.episode)){
        errors.episode = "recipe episode not found."
    }else{
        recipe.episode = req.body.episode;
    }
    if(isEmpty(req.body.youtube)){
        errors.youtube = "recipe youtube not found."
    }else{
        recipe.youtube = req.body.youtube;
    }
    if(isEmpty(req.body.title)){
        errors.title = "recipe title not found."
    }else{
        recipe.title = req.body.title;
    }
    if(isEmpty(req.body.image)){
        errors.image = "recipe image not found."
    }else{
        recipe.image = req.body.image;
    }
    if(isEmpty(req.body.ingredients)){
        errors.ingredients = "recipe ingredients not found."
    }else{
        recipe.ingredients = req.body.ingredients;
    }
    if(isEmpty(req.body.status)){
        errors.status = "recipe status not found."
    }else{
        recipe.status = req.body.status;
    }
    if(isEmpty(req.body.seen)){

        errors.seen = "recipe seen not found."
    }else{
        if(isNaN(parseInt(req.body.seen))){
            errors.seen = "Seen must in integer";
        }else{
            recipe.seen = req.body.seen;
        }
    }
    if(isEmpty(errors)){
        
        Recipe.findOneAndUpdate({link: recipe.link}, {$set: recipe}, {new: true}, (err, doc) => {
            if (err) {
                return res.status(400).json({msg: "Can not update recipe"});
            }
            return res.json({data: doc});
            /*
            Recipe.find().populate('category')
                .then(recfind =>{
                    return res.json({data: recfind});
                })
                .catch(err=>{
                    console.log("here 0")
                    return res.status(400).json({msg: "Can not get recipes"});
                })
                */
        });
    }else{
        console.log('here3', errors)
        return res.status(400).json({err: errors});
    }
});
router.post('/addComment', passport.authenticate('jwt', {session: false}), async (req, res)=>{
    console.log("add comment", req.body.text);
    const comment = isEmpty(req.body.text)? null : req.body.text;
    const recipelink = isEmpty(req.body.recipelink)? null: req.body.recipelink;
    const errors = {};
    if(isEmpty(comment)){
        errors.comment = "comment text can not be null";
    }
    if(isEmpty(recipelink)){
        errors.recipelink = "recipeid can not be null";
    }
    console.log("req ", req.user)
    if(isEmpty(errors)){
        const comment1 = {user: mongoose.Types.ObjectId(req.user._id), text: comment};
        console.log("req ", req.user)
        const recip =await  Recipe.updateOne(
            { link: recipelink}, 
            { $push: { comments: comment1}}
            
        );
        Recipe.findOne({link: recipelink}).populate('category')
        .populate('comments.user')
        .then(recfind =>{
            return res.json({data: recfind});
        })
        .catch(err=>{
            console.log("here 0")
            return res.status(400).json({msg: "Can not get recipes"});
        })
        //console.log("updated recipe ", recip);
    }else{
        return res.status(400).json({err: errors});
    }
    //console.log(req.user);
    //return res.json({text: "here "});

})
router.post('/add', passport.authenticate('jwt', {session: false}), (req, res)=>{
    console.log("add ");
    const recipe = {};
    const errors = {};
    if(isEmpty(req.body.link)){
        errors.link = "recipe link not found."
    }else{
        recipe.link = req.body.link;
    }
    if(isEmpty(req.body.cooktime)){
        errors.cooktime = "recipe cooktime not found."
    }else{
        recipe.cooktime = req.body.cooktime;
    }
    if(isEmpty(req.body.serves)){
        errors.serves = "recipe serves not found."
    }else{
        recipe.serves = req.body.serves;
    }
    if(isEmpty(req.body.preparation)){
        errors.preparation = "recipe preparation not found."
    }else{
        recipe.preparation = req.body.preparation;
    }
    if(isEmpty(req.body.preinstruction)){
        errors.preinstruction = "recipe preinstruction not found."
    }else{
        recipe.preinstruction = req.body.preinstruction;
    }
    if(isEmpty(req.body.category)){
        errors.category = "recipe category not found."
    }else{
        recipe.category = req.body.category;
    }
    if(isEmpty(req.body.episode)){
        errors.episode = "recipe episode not found."
    }else{
        recipe.episode = req.body.episode;
    }
    if(isEmpty(req.body.youtube)){
        errors.youtube = "recipe youtube not found."
    }else{
        recipe.youtube = req.body.youtube;
    }
    if(isEmpty(req.body.title)){
        errors.title = "recipe title not found."
    }else{
        recipe.title = req.body.title;
    }
    if(isEmpty(req.body.image)){
        errors.image = "recipe image not found."
    }else{
        recipe.image = req.body.image;
    }
    if(isEmpty(req.body.ingredients)){
        errors.ingredients = "recipe ingredients not found."
    }else{
        recipe.ingredients = req.body.ingredients;
    }
    if(isEmpty(req.body.status)){
        errors.status = "recipe status not found."
    }else{
        recipe.status = req.body.status;
    }
    if(isEmpty(req.body.seen)){

        errors.seen = "recipe seen not found."
    }else{
        if(isNaN(parseInt(req.body.seen))){
            errors.seen = "Seen must in integer";
        }else{
            recipe.seen = req.body.seen;
        }
    }
    if(isEmpty(errors)){
        const newrecipe = new Recipe(recipe);
        newrecipe.save()
        .then(newrec =>{
            if(newrec){
                /*
                Recipe.find().populate('category')
                .then(recfind =>{
                    return res.json({data: recfind});
                })
                .catch(err=>{
                    console.log("here 0")
                    return res.status(400).json({msg: "Can not get recipes"});
                })
                */
               return res.json({data: newrec})

            }else{
                console.log("here1")
                return res.status(400).json({msg: "Can not add recipes"})
            }
        })
        .catch(err=>{
            console.log("here 2", err)
            return res.status(400).json({msg: "Can not add recipes"});
        })
    }else{
        console.log('here3', errors)
        return res.status(400).json(errors);
    }

});
router.get('/item/:id', (req, res)=>{
    console.log("router ", req.params);
    const id = req.params.id ? req.params.id: null;
    if(id){
        Recipe.findOne({_id: req.params.id}).populate('category')
        .populate('comments.user')
        .then( async re =>{
            
            
            try{
                const recipe = {};
                recipe.link = re.link; 
                await recipeUpdate(recipe);
                console.log(" res ", re);
                Recipe.findOne({_id: req.params.id}).populate('category')
                .then(re=>{
                    res.json({data: re});
                })
                
            }catch(e){
                console.log("e ee e",e);
            }
            
            //res.json({data: re});
        })
    }else{
        return res.json({msg: 'recipe parameter not defined.'})
    }
    
});
router.get("/getByCategory", (req, res)=>{
    console.log("get category by ", req.query.category);
    const category = isEmpty(req.query.category) ? null : req.query.category;
    const page = isNaN(parseInt(req.query.page))|| parseInt(req.query.page)===0 ? 1: parseInt(req.query.page);
    const limit = isNaN(parseInt(req.query.limit))|| parseInt(req.query.limit)===0 ? 20: parseInt(req.query.limit);
    if(category){
        Category.findOne({name: category})
        .then(re1=>{
            console.log("Category ", re1);
            Recipe.find({category: {$in: [re1._id]}}, function(err, count){
                if(err){
                    console.log("count err")
                    let errors = {};
                    errors.msg  = "Can not get recipes";
                    return res.status(400).json({err: errors})
                }
                console.log("coutn ok")
                Recipe.find({category: {$in: [re1._id]}}).populate('category')
                .skip((page-1) * limit)
                .limit(limit)
                .then( async re=>{
                    console.log(
                        "recipes  ", re.length
                    )
                    await res.json({data: {count: count.length, recipes: re}});
                })
                .catch(err=>{
                    console.log("recipes find err")
                    let errors = {};
                    errors.msg  = "Can not get recipes";
                    return res.status(400).json({err: errors})
                });
    
            });
        })
        .catch(err=>{
            console.log("category err")
            let errors = {};
                    errors.msg  = "Can not get category";
                    return res.status(400).json({err: errors})
        })
        
    }else{
        let errors = {};
        errors.msg = "Can not get recipes";
        return status(400).json({err: errors});
    }
})
router.get("/parsetest", (req, res)=>{
    console.log("parse test");
})
//passport.authenticate('jwt', {session: false}), 
router.get('/parse/titles/:name', 
async (req, res)=>{
    console.log("parse title ", req.params);
    const name = req.params.name ? req.params.name : null;
    if(name){
        await  Category.findOne({name: name, special: false})
        .then( async cate=>{
            if(isEmpty(cate)){
                return res.json({msg: "cat is  empty"});
            }else{
                const ret = await getPageNumber(cate.name);
                console.log("ret ", ret);
                //await looppagenumber(ret, cate);
                return res.json({data: ret});
            }
        });
    }else{
        await  Category.find({special: false})
        .then( async cate=>{
            if(isEmpty(cate)){
                res.json({msg: "cat is  empty"});
            }else{
                await loopcategories(cate);
                console.log(" done  done done done");
                res.json({msg: "cat is not  empty"});
            }
        });
    }
   
});

router.get('/popular', async(req, res)=>{
    Recipe.find({seen: {$gt: 500000}})
    .limit(5)
    .then(re =>{
        res.json({data: re});
    })
    .catch(err=>{

        res.json({msg: " can not get recipe" });
    })
})
async function looprecipepagination(recarray){
    for(const rarray of recarray){
        console.log("rarray ", rarray);
        
        await getRecipeinLimit(rarray);
        
    }
}
function recipeUpdateSave(obj){

    
        Recipe.findOneAndUpdate({link: obj.link}, obj, {new: true, useFindAndModify: true}, (err, rec)=>{
            if(err){
               // reject(err);
            }else{
                console.log("updated   ", rec.youtube);
                //resolve(rec);
            }
        })

        
    
}
function recipeingregients(ingredientarray){
    return new Promise(function(resolve, reject){
        let forconst = '';
        let ingredients = {};
        let ingredientsmy = [];
        ingredientsmy.push({for: forconst, description: []});
        for(const ar of ingredientarray){
            if(ar.name == 'li'){
            // console.log("ar list ", ar.name);
                if(forconst ===''){
                    if(ingredients['empty']){
                        //console.log("read ok ")
                        ingredients = {...ingredients, 
                            ['empty']: [... ingredients['empty'], ar.children[1].data]};
                        
                            ingredientsmy = ingredientsmy.map(ele=>{
                                if(ele.for === forconst){
                                    ele.description.push(ar.children[1].data );
                                }
                                return ele;
                            })
                    }else{
                        //console.log("new bad");
                        ingredients = {...ingredients, 
                            ['empty']: [ar.children[1].data]};
                        
                            ingredientsmy = ingredientsmy.map(ele=>{
                                if(ele.for === forconst){
                                    ele.description.push(ar.children[1].data );
                                }
                                return ele;
                            })
                    }
                }else{
                    if(ingredients[forconst]){
                        //console.log("read ok ")
                        ingredients = {...ingredients, 
                            [forconst]: [... ingredients[forconst], ar.children[1].data]};

                            ingredientsmy = ingredientsmy.map(ele=>{
                                if(ele.for === forconst){
                                    ele.description.push(ar.children[1].data );
                                }
                                return ele;
                            })
                    }else{
                        //console.log("new bad");
                        ingredients = {...ingredients, 
                            [forconst]: [ar.children[1].data]};

                            ingredientsmy = ingredientsmy.map(ele=>{
                                if(ele.for === forconst){
                                    ele.description.push(ar.children[1].data );
                                }
                                return ele;
                            })
                    }
                }
                //ingredients.push({text: ar.children[1].data, for: forconst});
            }else if(ar.name == 'span'){
                //console.log("span ", ar.name);

                forconst = ar.children[0].children[0].data;
                ingredientsmy.push({for: forconst, description: []});
            }
        }
        //console.log("ingrdeints ===== >>> ", ingredients[forconst], forconst, ingredients);
        //console.log("ingredients", ingredientsmy);
        resolve(ingredientsmy);
    });
}
function preinstructionloop(preinstructions){
    return new Promise (function(resolve, reject){
        const preinstloop = [];
        for(const ar of preinstructions){
            //console.log(ar.type);
            if(ar.type === 'text' && ar.data.trim() !==''){
                preinstloop.push(ar.data.trim());
            }
        }
        resolve(preinstloop);
    })
}
async function recipecheerio(html, link){
    var $ = cheerio.load(html);
    const youtube1 =  $('div#video-div').find('iframe').get(0).attribs.src;
    let youtube = '';
    var VID_REGEX = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    
    //if(youtube1.match(VID_REGEX)){
    youtube = youtube1.match(VID_REGEX)[1];
    //}
    //console.log("regex ", youtube1.match(VID_REGEX)[1]);
   const preparation = $('div.cs-recipe-details').find('div').get(0).children[1].data;
    //const preparation = $('div.cs-recipe-single-preparation').find('ul').get(0);
    //console.log("preparation ", preparation);

    //jkl                    

    const cooktime = $('div.cs-recipe-details').find('div').get(1).children[1].data;
    const episode = $('div.cs-recipe-details').find('div').get(3).children[1].data;

    const arry = $('.cs-ingredients-check-list').find('ul').toArray();
    
    
    const ingredients =  await recipeingregients(arry[0].children);
    
    //const preinstruction = [];
    const process = $('.cs-recipe-single-preparation').find('ul').toArray()[0];
    
   const preinstruction = await  preinstructionloop(process.children);
    //console.log("preparation ", preinstruction);
    const recipe = {
        youtube: youtube, 
        preparation: preparation, 
        cooktime: cooktime, 
        episode: episode, 
        ingredients: ingredients, 
        preinstruction: preinstruction, 
        link: link
    }
    if(preinstruction === []){
       // console.log("=========++++++  preinstruction is empty ++++++++==========");
    } return recipe;

           
}
async function recipeUpdate(recipe){
    //console.log("recipe update ==>");
    return new Promise(function(resolve, reject){
        request(`http://www.laurainthekitchen.com/${recipe.link}`,
            async  (err, response, html)=>{
            if(!err && response.statusCode == 200){
                //console.log("body oke  =>     ", recipe.link);
                //console.log("after parse await");
               // resolve({html: html, link: recipe.link});
               
               const obj = await  recipecheerio(html, recipe.link);
               console.log("object  ", obj);
               await recipeUpdateSave(obj);
               //console.log('object  ', obj);

               //resolve(obj);
               resolve(obj);
            }else{
                //console.log("err ", err, response.statusCode, recipe.link);
                reject();
            }
        });
    });
}
async function getRecipeinLimit(rarray){
    var skip = (rarray-1)*10;
    console.log("rarray ", rarray);
    const recipefind = await Recipe.find().populate('category').limit(10).skip(skip);
    
    /*
    for(const recip of recipefind){
        await recipeUpdate(recip);
        //console.log("recipe ", recip.title);
    }
    */
    const promises = recipefind.map(recipeUpdate);
    //console.log("promises ", promises);
    await Promise.all(promises);
    //const recipefind = await Recipe.find().populate('category').limit(20).skip(0);
    //console.log('recipe find ', recipefind);
   
}
router.get('/parse/number/:number', async(req, res)=>{
    console.log("req params ", req.params.number);
    let number = 1;
    if(isNaN(parseInt(req.params.number))){
        number = parseInt(req.params.number);
    }else{
        number = 1;
    }
    //const number = !isNan(parseInt(req.params.number)) ? parseInt(req.param.number) : 1;
    await getRecipeinLimit(number);
    return res.json({data: "succeeded"});

})
router.get('/parse/recipefull', async(req, res)=>{
  const rec =  await Recipe.find();
   const reclen = rec.length;

  // const reclen = 59;
   //console.log("reclen", reclen);
   const recarray = [];
   const div = Math.ceil(reclen/10);
   //console.log("div", div);
   for(var i=1; i<= div; i++){
        recarray.push(i);
   }
   return res.json({data: recarray});
   //await looprecipepagination(recarray);
   console.log("done done done");
});


router.get('/recipeparse',  (req, res)=>{
    try{
        const recipe = {};
        recipe.link = 'recipes/sausage-and-peppers/'; 
    recipeUpdate(recipe);
    }catch(e){
        console.log("e ee e",e);
    }
});

module.exports = router;
