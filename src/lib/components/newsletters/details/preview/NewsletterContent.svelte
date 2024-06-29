<script>
	import {marked} from "marked";

    /**
     * @type {Record<string, any>}
     */
	export let newsletter;
</script>

<img alt="" class="" height="451" src="{newsletter.image}" width="451"/><br/>
<br/>
{@html marked.parse(newsletter.text)}