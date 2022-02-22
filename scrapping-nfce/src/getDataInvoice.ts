import puppeteer, { TimeoutError } from "puppeteer"
import { puppeteerArgs } from "./puppeteerArgs"

type Nfce = {
	CNPJ?: string;
	product_details?:[{
		description?: string | null;
		code?: string | null;
		amount?: string | null;
		unity?: string | null;
		unity_value?: string | null;
		total_value?: string | null;
	}] 

}
export async function getDataInvoice(invoiceNumber: string) {
	
	try
	{

		console.time(invoiceNumber);
		
		if (invoiceNumber.length !== 44) throw new Error("Invalid invoice number")

		const browser = await puppeteer.launch({
			// If you want use "headless" argument, passing "false"
			// You can't use "puppeteerArgs"
			args: puppeteerArgs,
		})
		const page = await browser.newPage()

		await page.goto(
			`http://www4.fazenda.rj.gov.br/consultaNFCe/QRCode?p=${invoiceNumber}|2|1|1|d6a14779b9504cef8546b3d32a02a32a86076883`
		)

		await page.waitForNavigation()
	
		const CorporateName = await page.$eval(
			"#u20",
			(el) => (el as HTMLElement).innerText
		)
		

		let product_details = await page.evaluate(() => {
			//Extract each episode's basic details
			let table = document.querySelector("#tabResult");
			if(table != null) {
				let product_list = Array.from(table.getElementsByTagName("tr")); 
				
				// Loop through each episode and get their details 
				let products_info = product_list
					.map(product => {
						let description = product.querySelector(".txtTit")?.textContent;
						let code = product.querySelector(".RCod")?.textContent;
						let amount = product.querySelector(".Rqtd")?.textContent;
						let unity = product.querySelector(".RUN")?.textContent;
						let unity_value = product.querySelector(".RvlUnit")?.textContent;
						let total_value = product.querySelector(".txtTit noWrap .valor")?.textContent;
						return { description, code, amount,unity,unity_value,total_value };
					}
				);
				
				return products_info;
			}
		});
		
		let NotaFiscal: Nfce = { CNPJ: CorporateName }
		// NotaFiscal.product_details = product_details;
		console.log(product_details)
				
		console.timeEnd(invoiceNumber)

		await browser.close()

	} catch (Error) {

		console.log(`\n \n ${Error}  \n \nOcorreu um erro, tentando novamente...${invoiceNumber}`)
		console.time(invoiceNumber);
		getDataInvoice(invoiceNumber)
		console.timeEnd(invoiceNumber);
	}


	
}
