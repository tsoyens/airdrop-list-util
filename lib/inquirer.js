const inquirer = require('inquirer');

module.exports = {
  askUser: () => {
    const questions = [
      {
        name: 'mnemonic',
        type: 'input',
        message: 'Enter your Zclassic 12-word mnemonic: ',
        validate: function( value ) {
          if (value.length) {
            return true;
          } else {
            return 'Enter your Zclassic 12-word mnemonic: ';
          }
        }
      }];
    return inquirer.prompt(questions);
  },
};
