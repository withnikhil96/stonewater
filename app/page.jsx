import Header from "../components/header"
import Footer from "../components/footer"
import ReservationForm from "../components/reservation"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-0 pb-8">
        <ReservationForm />
      </div>
      <Footer />
    </main>
  )
}
