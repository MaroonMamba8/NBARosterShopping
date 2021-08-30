if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

const evaluateMessageTextElement = document.querySelector('[evaluateMessageText]')
const evaluateMessageElement = document.getElementById('evaluateMessage')

function ready() {
    var removeCartItemButtons = document.getElementsByClassName('btn-danger')
    for (var i = 0; i < removeCartItemButtons.length; i++) {
        var button = removeCartItemButtons[i]
        button.addEventListener('click', removeCartItem)
    }

    var quantityInputs = document.getElementsByClassName('cart-quantity-input')
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i]
        input.addEventListener('change', quantityChanged)
    }

    var addToCartButtons = document.getElementsByClassName('shop-item-button')
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i]
        button.addEventListener('click', addToCartClicked)
    }

    document.getElementsByClassName('btn-evaluate')[0].addEventListener('click', evaluateClicked)
    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
    document.getElementsByClassName('btn-clear')[0].addEventListener('click', clearClicked)
}

var stripeHandler = StripeCheckout.configure({
    key: stripePublicKey,
    locale: 'en',
    token: function(token) {
        var items = []
        var cartItemContainer = document.getElementsByClassName('cart-items')[0]
        var cartRows = cartItemContainer.getElementsByClassName('cart-row')
        for (var i = 0; i < cartRows.length; i++) {
            var cartRow = cartRows[i]
            var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
            var quantity = quantityElement.value
            var id = cartRow.dataset.itemId
            items.push({
                id: id,
                quantity: quantity
            })
        }

        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: items
            })
        }).then(function(res) {
            return res.json()
        }).then(function(data) {
            alert(data.message)
            var cartItems = document.getElementsByClassName('cart-items')[0]
            while (cartItems.hasChildNodes()) {
                cartItems.removeChild(cartItems.firstChild)
            }
            updateCartTotal()
        }).catch(function(error) {
            console.error(error)
        })
    }
})

function evaluateClicked() {
    var championshipOdds = Number(document.getElementsByClassName('cart-total-skills')[0].innerText)
    console.log(championshipOdds)
    if (championshipOdds == -1) {
        evaluateMessageTextElement.innerText = `Your roster is not a valid roster. You must have 5 players!`
        evaluateMessageElement.classList.add(`invalid`)
    }
    if (0 <= championshipOdds && championshipOdds < 4) {
        evaluateMessageTextElement.innerText = `YOUR ROSTER SUCKS!!! Good luck even making the playoffs!`
        evaluateMessageElement.classList.add(`terrible`)
    }
    if (4 <= championshipOdds && championshipOdds < 7) {
        evaluateMessageTextElement.innerText = `Your roster will make the playoffs, but definitely not going to win!`
        evaluateMessageElement.classList.add(`playoffs`)
    }
    if (7 <= championshipOdds && championshipOdds < 9) {
        evaluateMessageTextElement.innerText = `Your roster has a CHANCE OF WINNING IT ALL! Although it's small.`
        evaluateMessageElement.classList.add(`contender`)
    }
    if (championshipOdds == 9) {
        evaluateMessageTextElement.innerText = `YOUR ROSTER IS A CHAMPIONSHIP FAVORITE!!! YOU'RE BY FAR THE BEST TEAM IN THE LEAGUE!`
        evaluateMessageElement.classList.add(`favorite`)
    }
    if (championshipOdds == 10) {
        evaluateMessageTextElement.innerText = `YOUR ROSTER IS UNSTOPPABLE!!!!!! YOU'RE PROBABLY GOING 82-0 AND SWEEPING THE '17 WARRIORS!!`
        evaluateMessageElement.classList.add(`unstoppable`)
    }
}

function clearClicked() {
    evaluateMessageElement.classList.remove('invalid')
    evaluateMessageElement.classList.remove('terrible')
    evaluateMessageElement.classList.remove('playoffs')
    evaluateMessageElement.classList.remove('contender')
    evaluateMessageElement.classList.remove('favorite')
    evaluateMessageElement.classList.remove('unstoppable')
}

function purchaseClicked() {
    // you can only purchase 5-men rosters
    var totalQuantity = quantitySum()
    if (totalQuantity != 5) {
        evaluateClicked()
    } else {
        var priceElement = document.getElementsByClassName('cart-total-price')[0]
        var price = parseFloat(priceElement.innerText.replace('$','')) * 100
        stripeHandler.open({
            amount: price
        })
    }
}

function quantitySum() {
    var quantityTotal = 0
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        var quantity = quantityElement.value
        quantityTotal += Number(quantity)
    }
    return quantityTotal
}

function removeCartItem(event) {
    var buttonClicked = event.target
    buttonClicked.parentElement.parentElement.remove()
    updateCartTotal()
}

function quantityChanged(event) {
    var input = event.target 
    if (isNaN(input.value) || input.value <= 0) {
        input.value = 1
    }
    updateCartTotal()
}

function addToCartClicked(event) {
    var button = event.target 
    var shopItem = button.parentElement.parentElement 
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
    var skills = shopItem.getElementsByClassName('shop-item-skills')[0].innerText
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
    var id = shopItem.dataset.itemId
    addItemToCart(title, price, skills, imageSrc, id)
    updateCartTotal()
}

function addItemToCart(title, price, skills, imageSrc, id) {
    var cartRow = document.createElement('div')
    cartRow.classList.add('cart-row')
    cartRow.dataset.itemId = id
    var cartItems = document.getElementsByClassName('cart-items')[0]
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title')
    for (var i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText == title) {
            alert('This item is already added to the cart')
            return 
        }
    }
    var cartRowContents = `
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
            <span class="cart-item-title">${title}</span>
        </div>
        <span class="cart-skills cart-column">${skills}</span>
        <span class="cart-price cart-column">${price}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="1">
            <button class="btn btn-danger" role="button">REMOVE</button>
        </div>`
    cartRow.innerHTML = cartRowContents
    cartItems.append(cartRow)
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem)
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged)
}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0
    var quantityTotal = 0
    var skillsTotal = [[],[],[],[],[],[]]
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var skillsText = cartRow.getElementsByClassName('cart-skills')[0].innerText
        var skillsElement = skillsText.split(",")
        var priceElement = cartRow.getElementsByClassName('cart-price')[0]
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        var price = parseFloat(priceElement.innerText.replace('$', ''))
        var quantity = quantityElement.value
        quantityTotal += Number(quantity)
        total += (price * quantity)
        for (var j = 0; j < quantity; j++) {
            skillsTotal = addLists(skillsTotal, skillsElement)
        }
    }
    total = Math.round(total * 100) / 100
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total
    var championshipCalculator = championshipOdds(skillsTotal,quantityTotal)
    //var championshipCalculator = 0
    document.getElementsByClassName('cart-total-skills')[0].innerText = championshipCalculator
}

function addLists(list1, list2) {
    var answer = list1 
    for (var i = 0; i < list2.length; i++) {
        answer[i].push(Number(list2[i]))
    }
    return answer
}

// add function for calculating championshipOdds
// each itemsJson's skills array is
// [playmaking,shooting,inside scoring,rebounding,defense,impact]

function championshipOdds(skillsArray,quantity) {
    if (quantity != 5) {
        return -1;
    }
    var championshipTotal = 0
    for (var i = 0; i < 6; i++) {
        skillsArray[i].sort()
        if (i == 0) {
            // playmaking: excellent primary playmaker + good second playmaker
            // good playmaking: 1
            const sum = skillsArray[i][4] + 0.7*skillsArray[i][3]
            if (sum > 1) {
                championshipTotal += 1
            }
        }
        if (i == 1) {
            // shooting: weighted sum of top three shooters
            // great shooting: 2, good shooting: 1
            const sum = skillsArray[i][4] + 0.8*skillsArray[i][3] + 0.5*skillsArray[i][2]
            if (sum > 1.2) {
                championshipTotal += 1
            }
            if (sum > 1.6) {
                championshipTotal += 1
            }
        }
        if (i == 2) {
            // inside scoring: weighted sum of all five scorers
            // great scoring: 2, good scoring: 1
            const sum = skillsArray[i][4] + skillsArray[i][3] + 0.8*skillsArray[i][2] + 0.7*skillsArray[i][1] + 0.5*skillsArray[i][0]
            if (sum > 2) {
                championshipTotal += 1
            }
            if (sum > 2.3) {
                championshipTotal += 1
            }
        }
        if (i == 3) {
            // rebounding: two best rebounders
            // good rebounding: 1
            const sum = skillsArray[i][4] + skillsArray[i][3]
            if (sum > 1.4) {
                championshipTotal += 1
            }
        }
        if (i == 4) {
            // defense: weighted sum of all five defenders
            // excellent defense: 3, great defense: 2, above average defense: 1
            const sum = skillsArray[i][4] + skillsArray[i][3] + 0.8*skillsArray[i][2] + 0.7*skillsArray[i][1] + 0.5*skillsArray[i][0]
            if (sum > 1.8) {
                championshipTotal += 1
            }
            if (sum > 2.2) {
                championshipTotal += 1
            }
            if (sum > 2.6) {
                championshipTotal += 1
            }
        }
        if (i == 5) {
            // impact: leader and good chemistry
            // good impact: 1
            const sum = skillsArray[i][4] + 0.2*(skillsArray[i][3]+skillsArray[i][2] + skillsArray[i][1] + skillsArray[i][0])
            if (sum > 1.05) {
                championshipTotal += 1
            }
        }
    }
    return championshipTotal
}