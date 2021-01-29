
 var firebaseConfig = {
    apiKey: "AIzaSyBZis3RlK4nvKvNUWLRTsLgB2GP8YUCw18",
    authDomain: "myexam-475a5.firebaseapp.com",
    projectId: "myexam-475a5",
    storageBucket: "myexam-475a5.appspot.com",
    messagingSenderId: "848260915024",
    appId: "1:848260915024:web:765410dc55da3145689655"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

const app = Sammy('#container',function(){
    this.use('Handlebars','hbs')

    this.get('#/home',function(ctx){
        firebase.firestore().collection('destinations').get()
        .then((response)=>{
            ctx.trips = response.docs.map((event)=> {return {id:event.id,...event.data()}})
            
            extendData(ctx)
        getHeaderAndFooter(ctx).then(function(){
            this.partial('./templates/home.hbs')
        })
        
        })
    })

    this.get('#/login',function(ctx){
        extendData(ctx)
        getHeaderAndFooter(ctx).then(function(){
            this.partial('./templates/login.hbs')
        })
    })

    this.get('#/destinations',function(ctx){
        firebase.firestore().collection('destinations').get()
        .then((response)=>{
            let userPosts = []
            response.docs.forEach((event)=>{
                if(event.data().creator == getUser(ctx).uid) {
                    userPosts.push({id:event.id,...event.data()})
                }
            } )
           ctx.myPosts = userPosts
         
            
            extendData(ctx)
            getHeaderAndFooter(ctx).then(function(){
                this.partial('./templates/detailsDashboard.hbs')
            })    
        })
   
    })

    this.get('#/create',function(ctx){
        extendData(ctx)
        getHeaderAndFooter(ctx).then(function(){
            this.partial('./templates/create.hbs')
        })
    })

    this.get('#/register',function(ctx){
        extendData(ctx)
        getHeaderAndFooter(ctx).then(function(){
            this.partial('./templates/register.hbs')
        })
    })

    this.post('#/register',function(ctx){
        const {email,password,rePassword} = ctx.params
        if(password != rePassword) {
            notify('Password not match','#errBox')
            return
        }
        if(password.length > 6) {
            notify('Password should be at least 6 char long','#errBox')
            return
        }
        firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((response)=>{
            notify("User registration successfull.","#succBox")
            setTimeout(() => {
                this.redirect(`#/home`)
            }, 1000);
            
        })
        .catch(err=>{
            notify(err.message,"#errBox")
        })
    })

    this.post('#/login',function(ctx){
        const {email,password} = ctx.params
        firebase.auth().signInWithEmailAndPassword(email, password)
        .then((response)=>{
            saveUserData(response)
            notify("Loggin successfull","#succBox")
                setTimeout(() => {
                    this.redirect(`#/home`)
                }, 1000);
        })
        .catch(err=>{
            notify(err.message,"#errBox")
        })
       
    })

    this.get('#/logout',function(ctx){
        firebase.auth().signOut()
        .then((response)=>{
            deleteData()
            notify("Logout successfull","#succBox")
                setTimeout(() => {
                    this.redirect(`#/home`)
                }, 1000);
        })
        .catch(err=>{
            notify(err.message,"#errBox")
        })
    })

    this.post('#/create',function(ctx){
        let {destination,city,duration,departureDate,imgUrl} = ctx.params
        duration = Number(duration)

        if(destination == `` || city == `` || duration == `` || departureDate == `` || imgUrl == ``) {
            notify('Inputs cant be empty',"#errBox")
            return
        }
        if(typeof(destination) != "string" || typeof(city) != "string" || typeof(duration) != "number" || typeof(departureDate) != "string" || typeof(imgUrl) != "string") {
            notify('Wrong format of input',"#errBox")
            return
        }
        if(duration <=0 || duration > 100) {
            notify('Duration is not in range of 1 or 100',"#errBox")
            return
        }

        firebase.firestore().collection('destinations').add({
            destination:destination,
            city:city,
            duration:duration,
            departureDate:departureDate,
            imgUrl:imgUrl,
            creator:getUser(ctx).uid
        })
        .then((response)=>{
            notify("Successfully added","#succBox")
            setTimeout(() => {
                this.redirect(`#/home`)
            }, 1000);
        })
        .catch(err=>{
            notify(err.message,"#errBox")
        })
    })

    this.get('#/details/:id',function(ctx){
        const {id} = ctx.params
        firebase.firestore().collection('destinations').doc(id).get()
        .then((response)=>{
            const  imTheCreator = response.data().creator == getUser(ctx).uid 
            ctx.event = {...response.data(),imTheCreator,id:id,}
            extendData(ctx)
            getHeaderAndFooter(ctx).then(function(){
                this.partial('./templates/details.hbs')
            })
        })
    })

    this.get('#/edit/:id',function(ctx){
        const {id} = ctx.params
        firebase.firestore().collection('destinations').doc(id).get()
        .then((response)=>{
            ctx.event = {id:id,...response.data()}
            extendData(ctx)
            getHeaderAndFooter(ctx).then(function(){
                this.partial('./templates/edit.hbs')
            })
        })
    })

    this.post('#/edit/:id',function(ctx){
        
        let {destination,city,duration,departureDate,imgUrl,id} = ctx.params
        duration = Number(duration)
        if(destination == `` || city == `` || duration == `` || departureDate == `` || imgUrl == ``) {
            notify('Inputs cant be empty',"#errBox")
            return
        }
        if(typeof(destination) != "string" || typeof(city) != "string" || typeof(duration) != "number" || typeof(departureDate) != "string" || typeof(imgUrl) != "string") {
            notify('Wrong format of input',"#errBox")
            return
        }
        if(duration <=0 || duration > 100) {
            notify('Duration is not in range of 1 or 100',"#errBox")
            return
        }
        firebase.firestore().collection('destinations').doc(id).update({
            destination:destination,
            city:city,
            duration:duration,
            departureDate:departureDate,
            imgUrl:imgUrl,
            creator:getUser(ctx).uid, 
        })
        .then((response)=>{
            notify("Successfully editted destination","#succBox")
            setTimeout(() => {
                this.redirect(`#/details/${id}`)
            }, 1000);
            
        })
        .catch(err=>{
            notify(err.message,"#errBox")
        })

    })

    this.get('#/delete/:id',function(ctx){
        const {id} = ctx.params
        getHeaderAndFooter(ctx).then(function(){
            firebase.firestore().collection('destinations').doc(id).delete()
            .then((response)=>{
                notify("Destination deleted","#succBox")
            setTimeout(() => {
                ctx.redirect(`#/destinations`)
            }, 1000);
                
            })
        })
    })








});


(()=>{
app.run('#/home')
})()


function notify(mesage,selector) {
    const notification = document.querySelector(selector)
    notification.textContent = mesage;
    notification.style.display = 'block'
    setTimeout(()=>{
        notification.style.display = `none`
        
    },1500)
    
}

function getHeaderAndFooter(context) {
    return context.loadPartials({
        'header': './templates/header.hbs',
        'footer': './templates/footer.hbs'
    })
}



function getUser() {

    const user = localStorage.getItem(`userInfo`)
    return user ? JSON.parse(user) : null

}

function saveUserData(contex) {
    
    const { user: { email, uid } } = contex;
    localStorage.setItem(`userInfo`, JSON.stringify({ email, uid }))

}

function extendData(contex) {
    let user = getUser()
    contex.isLoggedIn = Boolean(user);
    contex.email = user ? user.email : ``;
}

function deleteData() {
   localStorage.removeItem(`userInfo`);
}

