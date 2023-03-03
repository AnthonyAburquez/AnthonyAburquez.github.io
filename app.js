const sections = document.querySelectorAll(".section");
const sectBtns = document.querySelectorAll(".controls"); // parent
const sectBtn = document.querySelectorAll(".control"); // actual button
const allSections = document.querySelector(".main-content");
const icons = document.querySelector(".fa-solid")
function PageTransitions(){
    // button click active class 

    for (let i =0; i < sectBtn.length; i++){
        sectBtn[i].addEventListener("click", function(){
            let currentBtn  =  document.querySelectorAll(".active-btn");
            currentBtn[0].className = currentBtn[0].className.replace("active-btn","")
            this.className += ' active-btn';
        })
    }

    // section active class
    allSections.addEventListener("click",(e)=>{
        const id = e.target.dataset.id;
        
        if(id){
            //remove selected from the other button 
            sectBtns.forEach((btn)=>{ // looping through each button and getting rid of active class
                btn.classList.remove("active")
            })

            //remove selected from the other button 
            sectBtn.forEach((btn)=>{ // looping through each button and getting rid of active class
                btn.classList.remove("active")
            })

            //hide other sections
            sections.forEach((section)=>{
                section.classList.remove("active")
            })

            e.target.classList.add("active")

           
            const element = document.getElementById(id);
            element.classList.add("active")
        }
    })

    //Toggle theme
    const themeBtn = document.querySelector(".theme-btn");
    themeBtn.addEventListener("click",()=>{
        let element =  document.body;
        element.classList.toggle("light-mode")
    })

}
PageTransitions();