



const therapistform = document.getElementById('therapistAdressForm');
const address = document.getElementById('inputAddress');
const address2 = document.getElementById('inputState');
const state = document.getElementById('inputAddress2');
const city = document.getElementById('inputCity');
const zipcode = document.getElementById('inputZip');



// Send POST to API to add store
function addAdress(e) {

  // if (storeId.value === '' || storeAddress.value === '') {
  //   alert('Please fill in fields');
  // }

  const sendBody = {
    address: address.value,
    address2: address2.value,
    state: state.value,
    city: city.value,
    zip: zipcode.value

  };


  fetch('maketherapistAdressaddress', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sendBody)
    })
  }
  //   .then((response) => {
  //     if (response.ok) return response.json();
  //     console.log(response);
  //   })
  //   .then((data) => {
  //     console.log(data);
  //    window.location.reload(true);
  //   })
  // }

// therapistform.addEventListener('submit', addAdress);

window.onload = function() {
  let mapbtn = document.getElementById("mapbtn");
  mapbtn.addEventListener("click", getCoordinates1);


}

function getCoordinates1(name) {

  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?&key=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8&address=02906`

  locObj =  fetch(geoUrl)
  .then( (res) => res.json()).then( (data) =>
  {
    console.log(data);
    // return data.results[0].geometry.location;
  }).then((res) => res);
  }

// let coordinates1 = getCoordinates1(latinaze(name2));
// console.log(coordinates1);
