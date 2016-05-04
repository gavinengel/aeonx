# TODO


// TODO: fix `0 bug`.  to replicate: 1-1, 0 is on screen.  then click and num.

// TODO: 2 ifs fails:
/*

    ".num": {
      "@onclick": {
        "@if(.screen & value != 0)": {
          ".screen & value": ["&", "`value`"]
        },
        "@if(.screen & value = 0)": {
          ".screen & value": "`value`"
        }
      }
    },



    .num {
      @onclick {
        @if(.screen & value != 0) {
          .screen & value: 2
        }
        @if(.screen & value = 0) {
          .screen & value: 3
        }
      }
    }
*/

BUG, double click & click screen with:

#calculator {
  .eval {
    @onclick {
      .screen & value: $filters.equal;
    }
  }
  .num {
    @on(click) {
      .screen & value.: value;
    }
  }
  .dec {
    @onclick {
      .screen & value.: $filters.dot;
    }
  }
  .operator {
    @onclick {
      .screen & value.: $filters.operator; 
    }
  }
  .clear {
    @onclick {
      .screen & value: '';
    }
  }
  .top {
    @onclick(button = 3)  {
      @if(.screen & value = 12) {
        .screen & value: 1337;
      }
    }
    @ondblclick {
      .screen & value: 12;
    }
  }

}
