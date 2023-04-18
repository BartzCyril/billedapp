/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import mockStore from "../__mocks__/store";
jest.mock("../app/store", () => mockStore);

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId('icon-window')
      const activeIcon = windowIcon.classList.contains("active-icon");
      expect(activeIcon).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then I should navigate to the 'New Bill' page", () => {
      const onNavigate = jest.fn()
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const bills = new Bills({
        document,
        onNavigate: onNavigate,
        firestore: mockStore,
        localStorage,
      });
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      root.innerHTML = ROUTES({ pathname: ROUTES_PATH["Bills"], loading: true });
      document.body.innerHTML = BillsUI({ data: [] });
      const button = screen.getByTestId("btn-new-bill")
      const handleClickNewBill = jest.fn(() => {
        bills.handleClickNewBill()
      })
      button.addEventListener('click', handleClickNewBill)
      fireEvent.click(button)
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill)
    });

    test("Then on click on icon eye a modal open", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const store = null
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBills = new Bills({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.location,
      });
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      root.innerHTML = ROUTES({ pathname: ROUTES_PATH["Bills"], loading: true });
      document.body.innerHTML = BillsUI({ data: bills });
      const iconEye = screen.getAllByTestId("icon-eye")[0]
      const handleClickIconEye  = jest.fn(() => {
        newBills.handleClickIconEye(iconEye)
      })
      iconEye.addEventListener("click", handleClickIconEye)
      fireEvent.click(iconEye)
      expect(handleClickIconEye).toHaveBeenCalled()
    })
  });

  test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const contentType = await screen.getByText("Type")
      expect(contentType).toBeTruthy()
      const contentName = await screen.getAllByText("Nom")[0]
      expect(contentName).toBeTruthy()
      expect(screen.getAllByTestId("tbody")[0]).toBeTruthy()
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
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
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

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});