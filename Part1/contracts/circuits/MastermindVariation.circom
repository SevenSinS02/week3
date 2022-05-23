pragma circom 2.0.0;

// [assignment] implement a variation of mastermind from https://en.wikipedia.org/wiki/Mastermind_(board_game)#Variation as a circuit
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
//Grand Mastermind with 4 holes and 5 colours and 5 shapes
//1-5 -> colours
//1-5 -> shapes

template RangeProof(n) {
    assert(n <= 252);
    signal input in; // this is the number to be proved inside the range
    signal input range[2]; // the two elements should be the range, i.e. [lower bound, upper bound]
    signal output out;

    //components to check lesser equal than and greater equal than
    component low = LessEqThan(n);
    component high = GreaterEqThan(n);

    low.in[0] <== in;   // set number
    low.in[1] <== range[1]; // set upper bound

    high.in[0] <== in; // set number
    high.in[1] <== range[0]; //set lower bound
    
    // gives the result : 1 -> true, 0 -> false
    low.out * high.out ==> out;
}

template MastermindVariation() {
    // Public inputs
    signal input pubGuessA;
    signal input pubGuessB;
    signal input pubGuessC;
    signal input pubGuessD;
    signal input pubNumBlacks;
    signal input pubNumWhites;
    signal input pubSolnHash;

    // Private inputs: the solution to the puzzle
    signal input privSolnA;
    signal input privSolnB;
    signal input privSolnC;
    signal input privSolnD;
    signal input privSaltedSoln;

    // Output
    signal output solnHashOut;

    var numBlacks = 0;
    var numWhites = 0;

    var guess[4] = [pubGuessA, pubGuessB, pubGuessC, pubGuessD];
    var soln[4] =  [privSolnA, privSolnB, privSolnC, privSolnD];

    component rangeProof[40];
    var sum=0;

    // Create a constraint that the solution and guess digits fall within the valid ranges.
    // highest combination can be 55(5->colour,5->shape)
    
    for (var i=0,k=0; i<4; i++) {
        for(var j=1;j<6;j++){
            rangeProof[k] = RangeProof(6);
            rangeProof[k].in <== guess[i];
            rangeProof[k].range[0] <== j*10+1; //11,21,31,41,51
            rangeProof[k].range[1] <== j*10+5; //15,25,35,45,55
            sum +=rangeProof[k].out;

            rangeProof[k+1] = RangeProof(6);
            rangeProof[k+1].in <== soln[i];
            rangeProof[k+1].range[0] <== j*10+1; //11,21,31,41,51
            rangeProof[k+1].range[1] <== j*10+5; //15,25,35,45,55
            sum +=rangeProof[k+1].out;
            k+=2;
        }
        sum===2;
        sum=0;

    }

    //count black and whit pegs
    component equalHB[16];
    for (var j=0; j<4; j++) {
        for (var k=0; k<4; k++) {
            equalHB[4*j+k] = IsEqual();
            equalHB[4*j+k].in[0] <== soln[j];
            equalHB[4*j+k].in[1] <== guess[k];
            numWhites += equalHB[4*j+k].out;
            if (j == k) {
                numBlacks += equalHB[4*j+k].out;
                numWhites -= equalHB[4*j+k].out;
            }
        }
    }

    // Create a constraint around the number of blacks
    component equalBlacks = IsEqual();
    equalBlacks.in[0] <== numBlacks;
    equalBlacks.in[1] <== pubNumBlacks;
    equalBlacks.out === 1;
    
    // Create a constraint around the number of whites
    component equalWhites = IsEqual();
    equalWhites.in[0] <== numWhites;
    equalWhites.in[1] <== pubNumWhites;
    equalWhites.out === 1;

    // Verify that the hash of the private solution matches pubSolnHash
    // via a constraint that the publicly declared solution hash matches the
    // private solution witness

    component poseidon = Poseidon(5);
    poseidon.inputs[0] <== privSaltedSoln;
    poseidon.inputs[1] <== privSolnA;
    poseidon.inputs[2] <== privSolnB;
    poseidon.inputs[3] <== privSolnC;
    poseidon.inputs[4] <== privSolnD;

    solnHashOut <== poseidon.out;
    log(poseidon.out);
    log(pubSolnHash);
    pubSolnHash === solnHashOut;
}

component main{public [pubGuessA, pubGuessB, pubGuessC, pubGuessD, pubNumBlacks, pubNumWhites, pubSolnHash]} = MastermindVariation();