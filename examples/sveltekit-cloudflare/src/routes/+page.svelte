<script lang="ts">
	export let data;

	export let form;
</script>

{#if form?.success}
<h1>success</h1>
{:else}
<p>CSRF token value: {data.csrfToken}</p>
<h2>HTML Form Submission Example:</h2>
<form method="post">
	<legend>Form without CSRF (should fail):</legend>
	<input type="text" name="input1" />
	<button type="submit">Submit</button>
</form>
<br />
<form method="post">
	<legend>Form with incorrect CSRF (should fail):</legend>
	<input type="hidden" name="csrf_token" value="notvalid" />
	<input type="text" name="input1" />
	<button type="submit">Submit</button>
</form>
<br />
<form method="post">
	<legend>Form with CSRF (should succeed):</legend>
	<input type="hidden" name="csrf_token" value={data.csrfToken} />
	<input type="text" name="input1" />
	<button type="submit">Submit</button>
</form>
{/if}
