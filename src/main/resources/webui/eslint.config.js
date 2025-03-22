
import eslint from "@eslint/js";
import stylisticJs from "@stylistic/eslint-plugin-js";
import { globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config([
	globalIgnores(["./dist"]),
	eslint.configs.recommended,
	tseslint.configs.recommended,
	reactRefresh.configs.vite,
	reactHooks.configs["recommended-latest"],
	{
		plugins: {
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			"simple-import-sort/imports": "warn",
		},
	},
	{
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", {
				"args": "none",
				"caughtErrors": "none",
			}],
		},
	},
	/*
	stylisticJs.configs.all,
	{
		rules: {
			"no-console": "warn",
			"eqeqeq": "error",
			"@stylistic/js/object-curly-spacing": ["error", "always"],
			"@stylistic/js/indent": ["error", "tab"],
			"@stylistic/js/quotes": ["error", "double", {
				allowTemplateLiterals: "always",
			}],
			"@stylistic/js/quote-props": ["error", "consistent"],
			"@stylistic/js/comma-dangle": ["error", "always-multiline"],
			"@stylistic/js/array-bracket-newline": "off",
			"@stylistic/js/array-element-newline": "off",
		},
	},
	*/
]);
