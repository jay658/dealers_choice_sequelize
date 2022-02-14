const Sequelize = require('sequelize')
const db = new Sequelize(process.env.DATABASE_URL || "postgres://localhost/sequelize_hw_db")
const express = require('express')
const app = express()
const methodOverride = require('method-override')

app.use(express.urlencoded({extended:false}))
app.use(methodOverride('_method'))

const Category = db.define("category", {
    name:{
        type: Sequelize.STRING,
        allowNull: false,
        validate:{
            notEmpty:true
        }
    }
})

const Food = db.define("food", {
    name:{
        type: Sequelize.STRING,
        allowNull: false,
        validate:{
            notEmpty:true
        }
    }
})

Food.belongsTo(Category)
Category.hasMany(Food)

app.delete('/foods/:id', async(req, res, next)=>{
    try{
        const food = await Food.findByPk (req.params.id)
        await food.destroy()
        res.redirect(`/foods/${food.categoryId}`)
    }catch(err){
        next(err)
    }
})

app.post('/foods', async(req, res, next)=>{
    try{
        const food = await Food.findAll()
        if(food.reduce((acc, item)=>{
            if(item.name === req.body.name) acc = false
            return acc
        }, true)){
            const food = await Food.create(req.body)
            res.redirect(`/foods/${food.categoryId}`)
        }else{
            res.redirect(`/error`)
        }
    }catch(err){
        next(err)
    }
})

app.get('/error', (req, res, next)=>{
    try{
        res.send(`
            <html>
                <body>
                    <div>Oops! Something went wrong!</div>
                    <a href ='/'> Back to safety</a>
                </body>
            </html>
        `)
    }catch(err){
        next(err)
    }
})

app.get('/test/:id', async(req, res, next)=>{
    try{
        const food = await Food.findAll()
        if(food.reduce((acc, item)=>{
            if(item.name === req.params.id) acc = false
            return acc
        }, true)){
            res.send('Good to go')
        }else{
            res.send('No good')
        }
    }catch(err){

    }
})

app.get('/foods/:id', async(req, res, next)=>{
    try{
        const category = await Category.findByPk(req.params.id,{
            include: [Food]
        })
        const html = category.food.map(item=>{
            return `
                <div>
                    ${item.name}
                    <form method = 'POST' action ='/foods/${item.id}?_method=delete'>
                        <button>x</button>
                    </form>
                </div>
            `
        }).join('')
        res.send(`
            <html>
                <head>
                    <title>Foods</title>
                </head>
                <body>
                    <h1>${category.name}</h1>
                    ${html}

                    <div><a href = '/'> << Back</a></div>
                </body>
            </html>
        `)
    }catch(err){
        next(err)
    }
})

app.get('/', (req, res)=> res.redirect('/foods'))

app.get('/foods', async(req, res, next)=>{
    try{
        const foods = await Food.findAll({
            include: [Category]
        })

        const categories = await Category.findAll()

        res.send(`
            <html>
                <head>
                    <title>Food Types</title>
                </head>
                <body>
                    <h1>Foods</h1>
                    <form method = 'POST'>
                        <input name = 'name' placeholder = 'name of food'/>
                        <select name ='categoryId'>
                            ${categories.map(category=>{
                                return `
                                    <option value ='${category.id}'>${category.name}</option>
                                `
                            }).join('')}
                        </select>
                        <button>Create</button>
                    </form>
                    ${foods.map((food)=>{
                        return `
                            <div>${food.name} - <a href ='/foods/${food.category.id}'>${food.category.name}</a></div>    
                        `
                    }).join("")}
                </body>
            </html>
        `)
    }catch(err){
        next(err)
    }
})

const setup = async()=>{
    try{
        console.log("running")
        await db.sync({force:true})
        const fruits = await Category.create({name: 'fruits'})
        const veggies = await Category.create({name: 'veggies'})
        const grains = await Category.create({name: 'grains'})
        const protein = await Category.create({name: 'protein'})
        await Food.create({name: 'grapes', categoryId: fruits.id})
        await Food.create({name: 'cherries', categoryId: fruits.id})
        await Food.create({name: 'broccoli', categoryId: veggies.id})
        await Food.create({name: 'bok choy', categoryId: veggies.id})
        await Food.create({name: 'rice', categoryId: grains.id})
        await Food.create({name: 'pork', categoryId: protein.id})
        await Food.create({name: 'chicken', categoryId: protein.id})
        const port = process.env.PORT || 3000
        app.listen(port, ()=>{
            console.log('server running')
        })
    }catch(err){
        console.log(err)
    }
}

setup()