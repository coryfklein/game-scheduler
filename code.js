function getDomoUser(){
  var data = JSON.parse(localStorage.getItem('domo_user'));
  if(data) {
    return {
      name: data.USER_FULLNAME || "",
      id: data.USER_ID || ""
    };
  }
  else {
    return {
      name: "",
      id: ""
    }
  }
}

function getUserId() { return (getDomoUser().id); }
function getUserName() { return getDomoUser().name; }

function CanvasState(canvas) {
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.context = canvas.getContext('2d');

  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  this.valid = false; // when set to false, the canvas will redraw everything
  this.table = new Table();

  var myState = this;
  this.interval = 30;
  setInterval(function() { myState.draw(); }, myState.interval);
}

CanvasState.prototype.clear = function() {
  this.context.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.draw = function() {
  if(!this.valid) {
    var context = this.context;
    this.clear();

    this.table.draw(context);

    if(this.game) {
    }

    this.valid = true;
  }
}

CanvasState.prototype.setGame = function(game) {
  this.table.game = game;
  this.valid = false;
}

function Table() {
  this.radius = $('canvas').width() * 0.95 / 2;
}

function toInteger(number) {
  return Math.round(  // round to nearest integer
    Number(number)    // type cast your input
  );
};

Table.prototype.draw = function(ctx) {
  var canvasWidth = $('canvas').attr('width');
  var canvasHeight = $('canvas').attr('height');
  var x = canvasWidth / 2;
  var y = canvasHeight / 2;
  ctx.fillStyle = '#9AC9EE';
  ctx.strokeStyle = '#9AC9EE';
  ctx.beginPath();
  ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fill();

  if(this.game) {
    var game = this.game;
    var p1 = game.playerOne;
    var p2 = game.playerTwo;
    var p3 = game.playerThree;
    var p4 = game.playerFour;
    var numPlayers = 0;

    ctx.fillStyle = '#BAE9FF';
    var hCenter = x;
    var vCenter = y;
    var rectWidth = toInteger(.13 * canvasWidth);
    var margin = toInteger(.07 * canvasWidth);
    var cardLeft = toInteger(0.323 * canvasWidth);
    var cardRight = toInteger(0.7 * canvasWidth);
    var cardTop = toInteger(0.38 * canvasWidth);
    var cardBottom = toInteger(0.3 * canvasWidth + cardTop);
    var cardWidth = toInteger(0.05 * canvasWidth);
    var cardHeight = toInteger(0.07 * canvasWidth);
    var cardMargin = toInteger(0.01 * canvasWidth);
    if(p1) {
      numPlayers++;
      ctx.fillRect(hCenter - rectWidth / 2, margin, rectWidth, rectWidth);
    }
    if(p2) {
      numPlayers++;
      ctx.fillRect(margin, vCenter - rectWidth / 2, rectWidth, rectWidth);
    }
    if(p3) {
      numPlayers++;
      ctx.fillRect(canvasWidth - (margin + rectWidth), vCenter - rectWidth / 2, rectWidth, rectWidth);
    }
    if(p4) {
      numPlayers++;
      ctx.fillRect(hCenter - rectWidth / 2, canvasHeight - (margin + rectWidth), rectWidth, rectWidth);
    }

    if(numPlayers > 1) {
      for(var cTop = cardTop; cTop + cardHeight < cardBottom; cTop = cTop + cardHeight + cardMargin) {
        for(var cLeft = cardLeft; cLeft + cardWidth < cardRight; cLeft = cLeft + cardWidth + cardMargin) {
          ctx.fillRect(cLeft, cTop, cardWidth, cardHeight);
        }
      }
    }
  }
}

var started = false;
$(document).ready(function () {
  if(started) return;
  started = true;

  var _this = this;

  var fb = new Firebase("https://lunch-dominion.firebaseio.com/");
  var s = new CanvasState(document.getElementById('canvas'));

  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();

  var weekDay = today.getDay();

  if(dd < 10) {
    dd = '0' + dd;
  }

  if(mm < 10) {
    mm = '0' + mm;
  }

  todayString = yyyy + '-' + mm + '-' + dd;

  fb.on('value', function(snapshot) {
    var data = snapshot.val();
    if(data && data[todayString]) {

      var game = data[todayString];
      _this.game = game;

      s.setGame(game);

      var p1 = game.playerOne;
      var p2 = game.playerTwo;
      var p3 = game.playerThree;
      var p4 = game.playerFour;

      $('.playerOne').html(p1 || "&nbsp;");
      $('.playerTwo').html(p2 || "&nbsp;");
      $('.playerThree').html(p3 || "&nbsp;");
      $('.playerFour').html(p4 || "&nbsp;");

      var playerName = getUserName();
      var currentPlayerIsSignedUp = p1 === playerName || p2 === playerName || p3 === playerName || p4 === playerName
      if(currentPlayerIsSignedUp) {
        $('.submit').hide();
        $('.exit').show();
      }
      else {
        $('.submit').show();
        $('.exit').hide();
      }

      var gameTime = new Date();
      gameTime.setHours(12, 10);
      var playerCount = 0;
      if(p1) playerCount++;
      if(p2) playerCount++;
      if(p3) playerCount++;
      if(p4) playerCount++;

      $('.theButton').hide();
      $('.filled-message').hide();
      $('.time-passed').hide();
      $('.weekend').hide();
      if(weekDay === 0 || weekDay === 6) {
        $('.weekend').show();
      }
      else if(today > gameTime) {
        $('.tomorrow').show();

        //$('.time-passed').show();
        $('.theButton').show();
      }
      else if(playerCount >= 4 && !currentPlayerIsSignedUp) {
        $('.filled-message').show();
      }
      else {
        $('.theButton').show();
      }
    }
    else {
      console.log('No data for ' + todayString + ', creating new data.');
      var todayRef = fb.child(todayString);
      todayRef.set({
        'playerOne': '',
        'playerTwo': '',
        'playerThree': '',
        'playerFour': ''
      });
    }
  }, function(errorObject) {
    console.log('The read failed: ' + errorObject.code);
  });

  $('.submit').bind('click', function() {
    var emptyPlayer = GetNextEmptyPlayer();
    if(emptyPlayer) {
      var todayRef = fb.child(todayString);
      _this.game[emptyPlayer] = getUserName();
      todayRef.set(_this.game);
    }
  });

  $('.exit').bind('click', function() {
    var position = GetPlayerPosition(getUserName());
    if(position) {
      var todayRef = fb.child(todayString);
      _this.game[position] = "";
      todayRef.set(_this.game);
    }
  });

  var GetPlayerPosition = function(name) {
    var game = _this.game;

    var p1 = game.playerOne;
    var p2 = game.playerTwo;
    var p3 = game.playerThree;
    var p4 = game.playerFour;

    if(p1 === name) {
      return "playerOne";
    }
    else if(p2 === name) {
      return "playerTwo";
    }
    else if(p3 === name) {
      return "playerThree";
    }
    else if(p4 === name) {
      return "playerFour";
    }
    return "";
  };

  var GetNextEmptyPlayer = function() {
    var game = _this.game

    var p1 = game.playerOne;
    var p2 = game.playerTwo;
    var p3 = game.playerThree;
    var p4 = game.playerFour;

    if(!p1) {
      return "playerOne";
    }
    else if(!p2) {
      return "playerTwo";
    }
    else if(!p3) {
      return "playerThree";
    }
    else if(!p4) {
      return "playerFour";
    }
    else {
      console.log("Sorry, all player slots are filled.");
      return "";
    }
  };
});
