/* eslint-disable import/extensions */
// eslint-disable-next-line no-undef
module.exports = {
	"env": {
		"browser": true,
		"es2021": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:react/recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:react/jsx-runtime",
		"plugin:import/recommended",
		"plugin:import/typescript",
	],
	"overrides": [{
		"files": ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
	}],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module"
	},
	"settings": {
		"react": {
			"version": "detect",
		},
	},
	"rules": {
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		],
		"brace-style": [
			"warn",
			"stroustrup"
		],
		"no-tabs": 0,
		"react/jsx-indent": [
			2,
			"tab"
		],
		"arrow-body-style": 0,
		"import/extensions": [
			1,
			"ignorePackages",
			{
				"tsx": "never",
				"ts": "never"
			}
		],
		"object-curly-newline": [
			1,
			{
				"consistent": true
			}
		],
		"import/prefer-default-export": 0,
		"react/jsx-filename-extension": [
			1,
			{
				"extensions": [
					".tsx"
				]
			}
		],
		"react/jsx-indent-props": [
			1,
			"tab"
		],
		"operator-linebreak": [
			1,
			"after"
		],
		"react/jsx-closing-bracket-location": 0,
		"max-len": [
			1,
			150
		],
		"react/jsx-props-no-spreading": 0,
		"react/require-default-props": 0,
		"react/jsx-one-expression-per-line": 0
	}
};
