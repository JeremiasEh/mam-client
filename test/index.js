const MamClient = require ('../index');

(async () => {
	try {

		let mamHelper = new MamClient (
			"public", 
			"XVL9DDMRFQFOJLLTSAP9CUGHWSDAHCQF9AWBCEOXXXOWZXSBFXBYOL99LJLIMPYATEKAPJXKZMPTBZVSP", 
			null
		);
		await mamHelper.updateState ();
		mamHelper.setMessage ({
			company: "tangleMesh UG",
			counter: 6,
			message: "Some message (public)",
			timestamp: Date.now (),
		});
        const result = await mamHelper.attachMessage ("tangleMesh");
        console.log (result);

	} catch (e) {
		console.error ("ERROR", e);
	}
})();