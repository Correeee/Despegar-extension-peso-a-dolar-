let dolarBlueVenta = 0
const pesosArray = document.getElementsByClassName('main-value')


if (pesosArray.length == 0 || pesosArray.length == 1) {

    const interval = setInterval(() => {

        if (pesosArray.length > 1) {
            clearInterval(interval)

            fetch('https://api.bluelytics.com.ar/v2/latest')
                .then(response => response.json())
                .then(data => {
                    dolarBlueVenta = data.blue.value_avg
                })
                .then(() => {

                    for (let i = 0; i < pesosArray.length; i++) {
                        const pesos = pesosArray[i];

                        const pesosText = pesos.textContent
                        const pesosFormatted = pesosText.split('.').join('')
                        const pesosConversion = (pesosFormatted / dolarBlueVenta).toFixed(2)

                        const dolarChild = document.createElement('span')
                        const div = document.createElement('div')
                        div.classList.add('div__priceConvertedDiv')
                        dolarChild.classList.add('priceConverted')
                        dolarChild.innerText = pesosConversion + ' USD'
                        const divNode = pesos.parentNode.appendChild(div)
                        divNode.parentNode.appendChild(dolarChild)
                        div.appendChild(dolarChild)

                    }
                })
                .catch(error => console.log(error))

        }
    }, 1000);

}

const pesosVuelosArray = document.getElementsByClassName('amount price-amount')

if (pesosVuelosArray.length == 0) {

    const interval = setInterval(() => {
        if (pesosVuelosArray.length !== 0) {
            clearInterval(interval)

            fetch('https://api.bluelytics.com.ar/v2/latest')
                .then(response => response.json())
                .then(data => {
                    dolarBlueVenta = data.blue.value_avg
                })
                .then(() => {

                    for (let i = 0; i < pesosVuelosArray.length; i++) {
                        const pesos = pesosVuelosArray[i];
                        const pesosText = pesos.textContent
                        const pesosFormatted = pesosText.split('.').join('')
                        const pesosConversion = (pesosFormatted / dolarBlueVenta).toFixed(2)

                        const dolarChild = document.createElement('span')
                        const div = document.createElement('div')
                        div.classList.add('div__priceConvertedDiv')
                        dolarChild.classList.add('priceConverted')
                        dolarChild.innerText = pesosConversion + ' USD'
                        const divNode = pesos.parentNode.appendChild(div)
                        divNode.parentNode.appendChild(dolarChild)
                        div.appendChild(dolarChild)

                    }
                })
                .catch(error => console.log(error))

        }
    }, 1000);

}

const pesosPacksArray = document.getElementsByClassName('pricebox-big-text')

if (pesosPacksArray.length == 0 || pesosPacksArray.length == 1) {

    const interval = setInterval(() => {
        if (pesosPacksArray.length > 1) {
            clearInterval(interval)

            fetch('https://api.bluelytics.com.ar/v2/latest')
                .then(response => response.json())
                .then(data => {
                    dolarBlueVenta = data.blue.value_avg
                })
                .then(() => {

                    for (let i = 0; i < pesosPacksArray.length; i++) {
                        const pesos = pesosPacksArray[i];
                        const pesosText = pesos.textContent
                        const pesosFormatted = pesosText.split('.').join('')
                        const pesosConversion = (pesosFormatted / dolarBlueVenta).toFixed(2)

                        const dolarChild = document.createElement('span')
                        const div = document.createElement('div')
                        div.classList.add('div__priceConvertedDiv')
                        dolarChild.classList.add('priceConverted')
                        dolarChild.innerText = pesosConversion + ' USD'
                        const divNode = pesos.parentNode.appendChild(div)
                        divNode.parentNode.appendChild(dolarChild)
                        div.appendChild(dolarChild)

                    }
                })
                .catch(error => console.log(error))

        }
    }, 1000);

}

const pesosOfferArray = document.getElementsByClassName('offer-card-pricebox-price-amount')

if (pesosOfferArray.length != 0) {

    const interval = setInterval(() => {

        if (pesosOfferArray.length > 0) {
            clearInterval(interval)

            fetch('https://api.bluelytics.com.ar/v2/latest')
                .then(response => response.json())
                .then(data => {
                    dolarBlueVenta = data.blue.value_avg
                })
                .then(() => {

                    for (let i = 0; i < pesosOfferArray.length; i++) {
                        const pesos = pesosOfferArray[i];
                        const pesosText = pesos.textContent
                        const pesosFormatted = pesosText.split('.').join('')
                        const pesosConversion = (pesosFormatted / dolarBlueVenta).toFixed(2)

                        const dolarChild = document.createElement('span')
                        const div = document.createElement('div')
                        div.classList.add('div__priceConvertedDivOffer')
                        dolarChild.classList.add('priceConverted')
                        dolarChild.innerText = pesosConversion + ' USD'
                        const divNode = pesos.parentNode.appendChild(div)
                        divNode.parentNode.appendChild(dolarChild)
                        div.appendChild(dolarChild)

                    }
                })
                .catch(error => console.log(error))

        }
    }, 1000);

}

const pesosEscapadasArray = document.getElementsByClassName('price-number')

if (pesosEscapadasArray.length == 0) {

    const interval = setInterval(() => {

        if (pesosEscapadasArray.length > 0) {
            clearInterval(interval)

            fetch('https://api.bluelytics.com.ar/v2/latest')
                .then(response => response.json())
                .then(data => {
                    dolarBlueVenta = data.blue.value_avg
                })
                .then(() => {

                    for (let i = 0; i < pesosEscapadasArray.length; i++) {
                        const pesos = pesosEscapadasArray[i];
                        const pesosText = pesos.textContent
                        const pesosFormatted = pesosText.split('.').join('')
                        const pesosConversion = (pesosFormatted / dolarBlueVenta).toFixed(2)

                        const dolarChild = document.createElement('span')
                        const div = document.createElement('div')
                        div.classList.add('div__priceConvertedDiv')
                        dolarChild.classList.add('priceConverted')
                        dolarChild.innerText = pesosConversion + ' USD'
                        const divNode = pesos.parentNode.appendChild(div)
                        divNode.parentNode.appendChild(dolarChild)
                        div.appendChild(dolarChild)

                    }
                })
                .catch(error => console.log(error))

        }
    }, 1000);

}

const pesosCarsArray = document.getElementsByClassName('price-info-total-value')

if (pesosCarsArray.length == 0) {

    const interval = setInterval(() => {

        if (pesosCarsArray.length > 0) {
            clearInterval(interval)

            fetch('https://api.bluelytics.com.ar/v2/latest')
                .then(response => response.json())
                .then(data => {
                    dolarBlueVenta = data.blue.value_avg
                })
                .then(() => {

                    for (let i = 0; i < pesosCarsArray.length; i++) {
                        const pesos = pesosCarsArray[i];
                        const pesosText = pesos.textContent
                        const pesosFormatted = pesosText.split('.').join('')
                        const pesosConversion = (pesosFormatted / dolarBlueVenta).toFixed(2)

                        const dolarChild = document.createElement('span')
                        const div = document.createElement('div')
                        div.classList.add('div__priceConvertedDiv')
                        dolarChild.classList.add('priceConverted')
                        dolarChild.innerText = pesosConversion + ' USD'
                        const divNode = pesos.parentNode.appendChild(div)
                        divNode.parentNode.appendChild(dolarChild)
                        div.appendChild(dolarChild)

                    }
                })
                .catch(error => console.log(error))

        }
    }, 1000);

}


const pesosFinalArray = document.getElementsByClassName('amount')
const finalPrice = pesosFinalArray[pesosFinalArray.length - 1]

if (pesosFinalArray.length != 0) {

    const interval = setInterval(() => {

        if (pesosFinalArray.length > 0) {
            clearInterval(interval)
            console.log(pesosFinalArray)
            fetch('https://api.bluelytics.com.ar/v2/latest')
                .then(response => response.json())
                .then(data => {
                    dolarBlueVenta = data.blue.value_avg
                })
                .then(() => {

                    const pesos = finalPrice;
                    const pesosText = pesos.textContent
                    const pesosFormatted = pesosText.split('.').join('')
                    const pesosConversion = (pesosFormatted / dolarBlueVenta).toFixed(2)

                    const dolarChild = document.createElement('span')
                    const div = document.createElement('div')
                    div.classList.add('div__priceConvertedDivFinalPrice')
                    dolarChild.classList.add('priceConverted')
                    dolarChild.innerText = pesosConversion + ' USD'
                    const divNode = pesos.parentNode.appendChild(div)
                    divNode.parentNode.appendChild(dolarChild)
                    div.appendChild(dolarChild)

                })
                .catch(error => console.log(error))

        }
    }, 1000);

}
