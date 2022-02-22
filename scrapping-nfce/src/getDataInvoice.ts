import puppeteer, { TimeoutError } from "puppeteer"
import { puppeteerArgs } from "./puppeteerArgs"

interface Products {
	description?: string;
	code?: string;
	amount?: string;
	unity?: string;
	unity_value?: string;
	total_value?: string;
}

interface Nfce  {
	Cnpj: string;
	CorporateName: string;
	Items?: Products[];
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
		const Cnpj = await page.$eval(
			"#u20",
			(el) => (el.nextElementSibling as HTMLElement).innerText
		)
		

		let product_details = await page.evaluate(() => {
			//Extract each episode's basic details
			let table = document.querySelector("#tabResult");
			if(table != null) {
				let product_list = Array.from(table.getElementsByTagName("tr")); 
				
				// Loop through each episode and get their details 
				let products_info = product_list
					.map(product => {
						let description = product.querySelector(".txtTit")?.textContent?.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
						let code = product.querySelector(".RCod")?.textContent?.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
						let amount = product.querySelector(".Rqtd")?.textContent?.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
						let unity = product.querySelector(".RUN")?.textContent?.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
						let unity_value = product.querySelector(".RvlUnit")?.textContent?.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
						let total_value = product.querySelector(".txtTit noWrap .valor")?.textContent?.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
						return { description, code, amount,unity,unity_value,total_value };
					}
				);
				
				return products_info;
			}
		});
		
		let NotaFiscal: Nfce = { 
			Cnpj: Cnpj,
			CorporateName: CorporateName,
			Items : product_details
		}
		
		console.log(NotaFiscal)
				
		console.timeEnd(invoiceNumber)

		await browser.close()

	} catch (Error) {

		console.log(`\n \n ${Error}  \n \nOcorreu um erro, tentando novamente...${invoiceNumber}`)
		console.time(invoiceNumber);
		getDataInvoice(invoiceNumber)
		console.timeEnd(invoiceNumber);
	}


	
}
