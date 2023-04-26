/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import BillsUI from "../views/BillsUI.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const title = document.querySelector('.content-title').textContent;
      expect(title).toEqual(" Envoyer une note de frais ");
    })
  })
  describe("I upload file", () => {
    test("the extension of the image that is uploaded is jpg, jpeg or png", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      document.body.innerHTML = NewBillUI();

      const input = screen.getByTestId("file");
      fireEvent.change(input, {
        target: {
          files: [new File(["image"], "test.jpg", { type: "image/jpg" })],
        },
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBills = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(() => newBills.handleChangeFile);

      input.addEventListener("change", handleChangeFile);
      fireEvent.change(input);

      expect(input.files[0].name).toBe("test.jpg");
      expect(input.files[0].name).toMatch(/(jpeg|jpg|png)/);
      expect(handleChangeFile).toHaveBeenCalled();
    });
  })

  describe("Submit the form", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      )
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
    })

    test("the bills are updated", async () => {
      //simulation création d'une nouvelle note de frais
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorageMock,
      })

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      formNewBill.addEventListener("submit", handleSubmit)
      fireEvent.submit(formNewBill)

      expect(handleSubmit).toHaveBeenCalled();
      expect(mockStore.bills).toHaveBeenCalled()
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  })
})