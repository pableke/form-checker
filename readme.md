# form-checker

Form validator by the attributes specified in the inputs tags, validate fields in the client side.

## Usage

A simple example:
```js
<form name="test" action="./index.html">
	<div id="inputs">
		<label for="number">Number Validation Examples</label><br />
		<input type="text" id="number" name="number" value="152.87"
			size="15" title="number field" tabindex="1" 
			maxlength="10" data-msg-maxlength="max length alowed = 10"
			number="latin" data-msg-number="number not valid"
			max="19" data-msg-max="num exceded max = 19"
			min="7" data-msg-min="min value = 7"
			range="[8, 18]" data-msg-range="value out of range"
			placeholder="01/01/2015" alt="" />

		<br /><br />

		<label for="email">E-mail Validation Examples</label><br />
		<input type="text" id="email" name="email" value="dsfaj@adsf.com"
			size="15" title="number field" tabindex="2"
			maxlength="100" data-msg-maxlength="max length alowed = 10"
			email="true" data-msg-email="invalid email format"
			placeholder="xxx@yyy.com" alt="" />

		<br /><br />

		<label for="regex">RegEx Validation Examples</label><br />
		<input type="text" id="regex" name="regex" value="123456789A"
			size="15" title="number field" tabindex="2"
			maxlength="10" data-msg-maxlength="max length alowed = 10"
			regex="^[1-9][0-9]{8,9}[a-zA-Z]$" data-msg-regex="invalid format"
			placeholder="xxx@yyy.com" alt="" />

		<br /><br />

		<label for="date">Date Validation Examples</label><br />
		<input type="text" id="date" name="date" value="01/01/2015"
			size="15" title="date field" tabindex="3"
			minlength="10" data-msg-minlength="min length alowed = 10"
			maxlength="10" data-msg-maxlength="max length alowed = 10"
			date="latinDate" data-msg-date="date not valid"
			maxdate="2015-12-31" data-msg-maxdate="date exceded"
			mindate="2015-01-01"
			placeholder="01/01/2015" alt="" />
	</div>

	<br /><br />

	<div>
		<button tabindex="100">Send</button>
		<button type="reset" tabindex="102" onclick="fc.flush();">Reset</button>
	</div>
</form>

<script type="text/javascript">
	var fc = new FormChecker($("form")[0]);
	$("form").submit(function() {
		fc.flush();
		alert(fc.check() ? "ok" : "error");
		return false;
	});
</script>
```
## License

(c) 2015-2016 Pablo Rosique, GitHub Inc.
