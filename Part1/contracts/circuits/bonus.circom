// [bonus] implement an example game from part d

pragma circom 2.0.3;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

//Circuit for a simplified version of pirate's dice
template PiratesDice() {

    signal input player1[5];//5 dice values
    signal input player2[5]; //5 dice values
    signal input guess[2]; // guess[0] -> count of the value, guess[1] -> value e.g: 2 3's -> [2,3] 
    signal input publicHash;
    signal input privateSalt;
    signal output out; //0 -> lost, 1 -> win

    component lessEqThan[2] ;

    // Verify that the players' dices match the committed hash to prevent brute force attacks
    component poseidon = Poseidon(11);

    poseidon.inputs[0] <== privateSalt;
    for(var i=1,k=0; i< 6; i++){
    poseidon.inputs[i] <== player1[k];
    poseidon.inputs[i+5] <== player2[k];
    k+=1;
    }

    poseidon.out === publicHash;

    //check if guess[0] is less than or equal to 10 (10 dices)
    lessEqThan[0]= LessEqThan(4);
    lessEqThan[0].in[0] <== guess[0];
    lessEqThan[0].in[1] <==10;
    lessEqThan[0].out === 1;

    //check if guess[1] is less than or equal to 6 (max value of a dice)
    lessEqThan[1]= LessEqThan(4);
    lessEqThan[1].in[0] <== guess[0];
    lessEqThan[1].in[1] <==6;    
    lessEqThan[1].out === 1;

    //check the total count of the dice value in player 1 and player 2
    component isEqual[11];
    var sum = 0;
    
    for(var i = 0,k=0;i <10 ;i+=2){
        isEqual[i] = IsEqual();
        isEqual[i].in[0] <== guess[1]; //check for dice value
        isEqual[i].in[1] <== player1[k]; 
        sum += isEqual[i].out;

        isEqual[i+1] = IsEqual();
        isEqual[i+1].in[0] <== guess[1]; //check for dice value
        isEqual[i+1].in[1] <== player2[k]; 
        sum += isEqual[i+1].out;

        k+=1;
    }
    isEqual[10] = IsEqual();
    isEqual[10].in[0] <== sum; //check for dice value
    isEqual[10].in[1] <== guess[0]; 

    // check if the count value is the same as the guess
    out<== isEqual[10].out ;
}

component main{public [guess,publicHash]} = PiratesDice();