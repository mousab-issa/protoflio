$(function(){
    $(window).scroll(function() {
       if($(window).scrollTop() >= 100) {
         $('.navb').addClass('scrolled');
        //  alert("scrolled");
       }
      else {
        $('.navb').removeClass('scrolled');
      }
    });
  });
  
